'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // hourlyRate and availability
    const table = 'users';
    const qi = queryInterface;

    // Add column helper: only add if not exists to be idempotent on some engines
    const addIfMissing = async (name, spec) => {
      try {
        const desc = await qi.describeTable(table);
        if (!desc[name]) {
          await qi.addColumn(table, name, spec);
        }
      } catch (e) {
        // Fallback add
        await qi.addColumn(table, name, spec);
      }
    };

    await addIfMissing('hourlyRate', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await addIfMissing('availability', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await addIfMissing('skills', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
    await addIfMissing('portfolioItems', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'hourlyRate');
    await queryInterface.removeColumn('users', 'availability');
    await queryInterface.removeColumn('users', 'skills');
    await queryInterface.removeColumn('users', 'portfolioItems');
  }
};
