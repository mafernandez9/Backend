module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn(
      'books', // table name
      'ISBN', // new field name
      {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
    ),
    queryInterface.addColumn(
      'users', // table name
      'role', // new field name
      {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'client',
      },
    ),

  ]),

  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('books');
  },
};
