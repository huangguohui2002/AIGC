import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRecords } from '../api/generate.js'

export const useGenerationStore = defineStore('generation', () => {
  const records = ref([])
  const total = ref(0)
  const currentTask = ref(null) // { type, status, result_url }

  async function fetchRecords(params = {}) {
    try {
      const res = await getRecords({ page: 1, limit: 20, ...params })
      if (res.success) {
        records.value = res.data.list || []
        total.value = res.data.total || 0
      }
    } catch {}
  }

  function setCurrentTask(task) {
    currentTask.value = task
  }

  function clearCurrentTask() {
    currentTask.value = null
  }

  return { records, total, currentTask, fetchRecords, setCurrentTask, clearCurrentTask }
})
