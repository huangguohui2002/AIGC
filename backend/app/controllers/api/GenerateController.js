const { Op } = require('sequelize');
const User = require('#models/User');
const Generation = require('#models/Generation');
const Transaction = require('#models/Transaction');
const db = require('#services/db.service');
const GenerationGateway = require('#services/generation.gateway');
const GeneratedMediaService = require('#services/generatedMedia.service');
const GeneratedMediaCleanupService = require('#services/generatedMediaCleanup.service');
const { success, fail, serverError } = require('#factories/responses/aigc');

module.exports = GenerateController;

function GenerateController() {
	const PENDING_JOB_TIMEOUT_MS = 10 * 60 * 1000;

	function normalizeReferenceUrls(...candidates) {
		return candidates
			.flatMap((candidate) => (Array.isArray(candidate) ? candidate : [candidate]))
			.filter((item) => typeof item === 'string' && item.trim())
			.map((item) => item.trim());
	}

	function isPendingJobTimedOut(generation) {
		if (!generation?.createdAt) return false;
		return Date.now() - new Date(generation.createdAt).getTime() >= PENDING_JOB_TIMEOUT_MS;
	}

	function serializeGeneration(generation, overrides = {}) {
		const baseRecord = typeof generation?.toJSON === 'function'
			? generation.toJSON()
			: generation;

		return GeneratedMediaCleanupService.serializeGenerationRecord({
			...baseRecord,
			...overrides
		});
	}

	function buildSuccessPayload(generation, overrides = {}) {
		const serialized = serializeGeneration(generation, overrides);

		return {
			generation_id: generation.id,
			status: 'success',
			result_url: serialized.result_url,
			progress: 100,
			expired: serialized.expired,
			asset_expires_at: serialized.asset_expires_at,
			asset_deleted_at: serialized.asset_deleted_at,
			asset_notice: serialized.asset_notice
		};
	}

	async function createConsumeTransaction(userId, generation) {
		const user = await User.findByPk(userId);
		await Transaction.create({
			user_id: userId,
			type: 'consume',
			amount: -generation.cost_points,
			balance_after: user?.points ?? 0,
			related_id: generation.id,
			related_type: 'generation',
			description: `${generation.type === 'image' ? '图片' : '视频'}生成消耗积分`
		});
	}

	async function failPendingGeneration(generation, userId, reason) {
		const refundPoints = generation.cost_points;
		const [updated] = await Generation.update(
			{ status: 'failed', error_message: reason, cost_points: 0 },
			{ where: { id: generation.id, status: 'pending' } }
		);

		if (updated > 0 && refundPoints > 0) {
			await User.increment(
				{ points: refundPoints, total_consumed: -refundPoints },
				{ where: { id: userId } }
			);
		}

		return updated > 0;
	}

	async function markGenerationSuccess({ req, generation, userId, result }) {
		const persistedAssets = await GeneratedMediaService.persistAssets({
			req,
			assets: result.assets || []
		});
		const resultUrl = persistedAssets[0]?.url || '';
		if (!resultUrl) {
			throw new Error('生成成功，但未获取到可保存的媒体资源');
		}

		const [updated] = await Generation.update(
			{
				status: 'success',
				result_url: resultUrl,
				asset_deleted_at: null,
				error_message: null,
				work_id: result.upstream_job_id || generation.work_id || null
			},
			{ where: { id: generation.id, status: 'pending' } }
		);

		if (updated > 0) {
			await createConsumeTransaction(userId, generation);
		}

		return {
			result_url: resultUrl,
			updated: updated > 0
		};
	}

	async function syncPendingGeneration({ req, generation, userId }) {
		if (!generation || generation.status !== 'pending' || !generation.work_id) return;

		const aiModel = await GenerationGateway.getModelForGeneration(generation);
		if (!aiModel) return;

		const result = await GenerationGateway.getGenerationResult({ aiModel, generation });

		if (result.status === 'success') {
			await markGenerationSuccess({ req, generation, userId, result });
			return;
		}

		if (result.status === 'failed') {
			await failPendingGeneration(generation, userId, result.error_message || 'Generation failed');
			return;
		}

		if (isPendingJobTimedOut(generation)) {
			await failPendingGeneration(generation, userId, '生成超时，积分已退回，请重新生成');
		}
	}

	async function reservePointsAndCreateGeneration({ userId, type, aiModel, prompt, params, costPoints }) {
		const transaction = await db.transaction();

		try {
			const user = await User.findByPk(userId, { transaction, lock: true });
			if (!user || user.points < costPoints) {
				await transaction.rollback();
				const error = new Error('积分不足');
				error.name = 'InsufficientPoints';
				throw error;
			}

			user.points -= costPoints;
			user.total_consumed += costPoints;
			await user.save({ transaction });

			const generation = await Generation.create(
				{
					user_id: userId,
					ai_model_id: aiModel.id,
					provider_id: aiModel.provider_id,
					type,
					model: aiModel.model_name,
					prompt,
					params,
					reference_image: params?.reference_image || null,
					cost_points: costPoints,
					status: 'pending'
				},
				{ transaction }
			);

			await transaction.commit();
			return generation;
		} catch (error) {
			if (transaction && !transaction.finished) await transaction.rollback();
			throw error;
		}
	}

	async function processSubmitResult({ req, generation, userId, result }) {
		if (result.status === 'success') {
			const finalized = await markGenerationSuccess({ req, generation, userId, result });
			return {
				...buildSuccessPayload(generation, {
					status: 'success',
					result_url: finalized.result_url,
					asset_deleted_at: null,
					error_message: null,
					work_id: result.upstream_job_id || null
				}),
				work_id: result.upstream_job_id || null,
				cost_points: generation.cost_points
			};
		}

		if (result.status === 'pending') {
			await generation.update({ work_id: result.upstream_job_id || null });
			return {
				generation_id: generation.id,
				status: 'pending',
				work_id: result.upstream_job_id || null,
				progress: result.progress || 0,
				cost_points: generation.cost_points
			};
		}

		throw new Error(result.error_message || '任务提交失败');
	}

	async function submitSingleGeneration({ req, userId, type, aiModel, prompt, params, submitFn }) {
		const generation = await reservePointsAndCreateGeneration({
			userId,
			type,
			aiModel,
			prompt,
			params,
			costPoints: aiModel.points_cost
		});

		try {
			const result = await submitFn();
			return await processSubmitResult({ req, generation, userId, result });
		} catch (submitError) {
			await generation.update({ status: 'failed', error_message: submitError.message, cost_points: 0 });
			await User.increment(
				{ points: aiModel.points_cost, total_consumed: -aiModel.points_cost },
				{ where: { id: userId } }
			);

			const error = new Error(submitError.message || '任务提交失败');
			error.name = 'GenerationFailed';
			throw error;
		}
	}

	async function submitBatchGeneration({ req, userId, type, aiModel, prompt, params, submitFn, count }) {
		const totalCost = aiModel.points_cost * count;
		const transaction = await db.transaction();
		const generations = [];

		try {
			const user = await User.findByPk(userId, { transaction, lock: true });
			if (!user || user.points < totalCost) {
				await transaction.rollback();
				const error = new Error('积分不足');
				error.name = 'InsufficientPoints';
				throw error;
			}

			user.points -= totalCost;
			user.total_consumed += totalCost;
			await user.save({ transaction });

			for (let index = 0; index < count; index += 1) {
				generations.push(await Generation.create({
					user_id: userId,
					ai_model_id: aiModel.id,
					provider_id: aiModel.provider_id,
					type,
					model: aiModel.model_name,
					prompt,
					params,
					reference_image: params?.reference_image || null,
					cost_points: aiModel.points_cost,
					status: 'pending'
				}, { transaction }));
			}

			await transaction.commit();
		} catch (error) {
			if (transaction && !transaction.finished) await transaction.rollback();
			throw error;
		}

		const settledResults = await Promise.allSettled(
			generations.map(async (generation) => {
				const result = await submitFn();
				return processSubmitResult({ req, generation, userId, result });
			})
		);

		const responseItems = [];
		let refundPoints = 0;

		for (let index = 0; index < settledResults.length; index += 1) {
			const settled = settledResults[index];
			const generation = generations[index];

			if (settled.status === 'fulfilled') {
				responseItems.push(settled.value);
				continue;
			}

			await generation.update({
				status: 'failed',
				error_message: settled.reason?.message || '任务提交失败',
				cost_points: 0
			});
			refundPoints += aiModel.points_cost;
		}

		if (refundPoints > 0) {
			await User.increment(
				{ points: refundPoints, total_consumed: -refundPoints },
				{ where: { id: userId } }
			);
		}

		if (responseItems.length === 0) {
			const error = new Error(settledResults[0]?.reason?.message || '全部任务提交失败');
			error.name = 'GenerationFailed';
			throw error;
		}

		return responseItems;
	}

	const generateImage = async (req, res) => {
		const {
			prompt,
			model,
			variants,
			urls,
			reference_images,
			aspectRatio,
			imageSize,
			size,
			quality,
			background,
			outputFormat,
			count: countRaw
		} = req.body;
		const userId = req.token?.id;
		const count = Math.max(1, Math.min(parseInt(countRaw, 10) || 1, 4));

		if (!prompt) return fail(res, '提示词不能为空');
		if (!model) return fail(res, '模型不能为空');

		try {
			const aiModel = await GenerationGateway.getActiveModelByName(model, 'image');
			if (!aiModel) return fail(res, '模型不存在或未启用', 'MODEL_NOT_FOUND');

			const referenceUrls = normalizeReferenceUrls(urls, reference_images);
			const imageParams = {
				prompt,
				variants,
				aspectRatio,
				imageSize,
				size,
				quality,
				background,
				outputFormat,
				urls: referenceUrls,
				reference_image: referenceUrls[0]
			};

			if (count === 1) {
				const data = await submitSingleGeneration({
					req,
					userId,
					type: 'image',
					aiModel,
					prompt,
					params: imageParams,
					submitFn: () => GenerationGateway.submitImageGeneration({ aiModel, prompt, params: imageParams })
				});
				return success(res, data.status === 'success' ? '生成成功' : '任务已提交', data);
			}

			const data = await submitBatchGeneration({
				req,
				userId,
				type: 'image',
				aiModel,
				prompt,
				params: imageParams,
				submitFn: () => GenerationGateway.submitImageGeneration({ aiModel, prompt, params: imageParams }),
				count
			});
			return success(res, '任务已提交', data);
		} catch (error) {
			if (error.name === 'InsufficientPoints') return fail(res, '积分不足', 'INSUFFICIENT_POINTS');
			if (error.name === 'GenerationFailed') return fail(res, error.message, 'GENERATION_FAILED');
			console.error('[GenerateController.generateImage]', error);
			return serverError(res);
		}
	};

	const generateVideo = async (req, res) => {
		const {
			prompt,
			model,
			url,
			aspectRatio,
			duration,
			seconds,
			size,
			firstFrameUrl,
			lastFrameUrl,
			urls,
			reference_images
		} = req.body;
		const userId = req.token?.id;

		if (!prompt) return fail(res, '提示词不能为空');
		if (!model) return fail(res, '模型不能为空');

		try {
			const aiModel = await GenerationGateway.getActiveModelByName(model, 'video');
			if (!aiModel) return fail(res, '模型不存在或未启用', 'MODEL_NOT_FOUND');

			const referenceUrls = normalizeReferenceUrls(urls, reference_images);
			const videoParams = {
				url,
				aspectRatio,
				duration,
				seconds,
				size,
				firstFrameUrl,
				lastFrameUrl,
				urls: referenceUrls,
				reference_image: referenceUrls[0]
			};

			const data = await submitSingleGeneration({
				req,
				userId,
				type: 'video',
				aiModel,
				prompt,
				params: videoParams,
				submitFn: () => GenerationGateway.submitVideoGeneration({ aiModel, prompt, params: videoParams })
			});
			return success(res, data.status === 'success' ? '生成成功' : '任务已提交', data);
		} catch (error) {
			if (error.name === 'InsufficientPoints') return fail(res, '积分不足', 'INSUFFICIENT_POINTS');
			if (error.name === 'GenerationFailed') return fail(res, error.message, 'GENERATION_FAILED');
			console.error('[GenerateController.generateVideo]', error);
			return serverError(res);
		}
	};

	const getResult = async (req, res) => {
		const { id } = req.body;
		const userId = req.token?.id;

		if (!id) return fail(res, '缺少 id 参数');

		try {
			const generation = await Generation.findOne({ where: { id, user_id: userId } });
			if (!generation) return fail(res, '任务不存在', 'NOT_FOUND');

			if (generation.status === 'success') {
				return success(res, '生成成功', buildSuccessPayload(generation));
			}

			if (generation.status === 'failed') {
				return fail(res, generation.error_message || '生成失败', 'GENERATION_FAILED');
			}

			if (!generation.work_id) {
				return fail(res, '任务 ID 缺失，请重新生成', 'INVALID_STATE');
			}

			const aiModel = await GenerationGateway.getModelForGeneration(generation);
			if (!aiModel) return fail(res, '模型不存在', 'MODEL_NOT_FOUND');

			const result = await GenerationGateway.getGenerationResult({ aiModel, generation });

			if (result.status === 'success') {
				const finalized = await markGenerationSuccess({ req, generation, userId, result });
				return success(res, '生成成功', buildSuccessPayload(generation, {
					status: 'success',
					result_url: finalized.result_url,
					asset_deleted_at: null,
					error_message: null,
					work_id: result.upstream_job_id || generation.work_id || null
				}));
			}

			if (result.status === 'failed') {
				const reason = result.error_message || 'Generation failed';
				await failPendingGeneration(generation, userId, reason);
				return fail(res, reason, 'GENERATION_FAILED');
			}

			if (isPendingJobTimedOut(generation)) {
				const timeoutMessage = '生成超时，积分已退回，请重新生成';
				await failPendingGeneration(generation, userId, timeoutMessage);
				return fail(res, timeoutMessage, 'GENERATION_FAILED');
			}

			return success(res, '生成中', {
				generation_id: generation.id,
				status: 'pending',
				progress: result.progress || 0,
				work_id: generation.work_id
			});
		} catch (error) {
			console.error('[GenerateController.getResult]', error);
			if (error.name === 'ResultQueryFailed') {
				return fail(res, error.message, 'RESULT_QUERY_FAILED');
			}
			return serverError(res);
		}
	};

	const getRecords = async (req, res) => {
		try {
			const userId = req.token?.id;
			const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
			const offset = (page - 1) * limit;
			const where = { user_id: userId };

			if (['image', 'video'].includes(req.query.type)) where.type = req.query.type;
			if (['pending', 'success', 'failed'].includes(req.query.status)) {
				where.status = req.query.status;
			} else if (req.query.exclude_failed === '1' || req.query.exclude_failed === 'true') {
				where.status = { [Op.ne]: 'failed' };
			}

			const pendingList = await Generation.findAll({
				where: { user_id: userId, status: 'pending', work_id: { [Op.not]: null } },
				order: [['createdAt', 'DESC']],
				limit: 50
			});
			if (pendingList.length > 0) {
				await Promise.allSettled(
					pendingList.map((generation) => syncPendingGeneration({ req, generation, userId }))
				);
			}

			const staleThreshold = new Date(Date.now() - PENDING_JOB_TIMEOUT_MS);
			const staleList = await Generation.findAll({
				where: {
					user_id: userId,
					status: 'pending',
					work_id: { [Op.is]: null },
					createdAt: { [Op.lt]: staleThreshold }
				}
			});

			if (staleList.length > 0) {
				const staleIds = staleList.map((item) => item.id);
				const totalRefund = staleList.reduce((sum, item) => sum + item.cost_points, 0);
				await Generation.update(
					{ status: 'failed', error_message: '生成超时，积分已退回，请重新生成', cost_points: 0 },
					{ where: { id: staleIds } }
				);
				await User.increment(
					{ points: totalRefund, total_consumed: -totalRefund },
					{ where: { id: userId } }
				);
			}

			const { count, rows } = await Generation.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				attributes: [
					'id',
					'type',
					'model',
					'prompt',
					'status',
					'result_url',
					'asset_deleted_at',
					'cost_points',
					'error_message',
					'createdAt'
				]
			});

			return success(res, '获取成功', {
				list: rows.map((row) => serializeGeneration(row)),
				total: count,
				image_retention_days: GeneratedMediaCleanupService.IMAGE_RETENTION_DAYS
			});
		} catch (error) {
			console.error('[GenerateController.getRecords]', error);
			return serverError(res);
		}
	};

	return {
		generateImage,
		generateVideo,
		getResult,
		getRecords
	};
}
