const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.user);
      this.belongsTo(models.review);
    }
  }
  report.init({
    userId: DataTypes.INTEGER,
    reviewId: DataTypes.INTEGER,
    content: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'report',
  });
  return report;
};
