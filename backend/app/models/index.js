require('./User');
require('./DisabledRefreshToken');
require('./SmsCode');
require('./PointsPackage');
require('./Order');
require('./Transaction');
require('./Generation');
require('./Invite');
require('./Announcement');
require('./Config');
require('./AiModel');
require('./AIProvider');
require('./ExampleCategory');
require('./ExampleItem');
require('./ExampleImage');

const ExampleCategory = require('./ExampleCategory');
const ExampleItem = require('./ExampleItem');
const ExampleImage = require('./ExampleImage');

ExampleCategory.hasMany(ExampleItem, { foreignKey: 'category_id', as: 'items' });
ExampleItem.belongsTo(ExampleCategory, { foreignKey: 'category_id', as: 'category' });
ExampleItem.hasMany(ExampleImage, { foreignKey: 'example_id', as: 'images' });
ExampleImage.belongsTo(ExampleItem, { foreignKey: 'example_id', as: 'example' });
