"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "username", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    // Optional: create index explicitly
    await queryInterface.addIndex("users", ["username"], {
      unique: true,
      name: "users_username_unique_idx",
      where: {
        username: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", "users_username_unique_idx");
    await queryInterface.removeColumn("users", "username");
  },
};
