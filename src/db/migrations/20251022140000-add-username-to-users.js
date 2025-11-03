"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add username column if it doesn't exist
    await queryInterface.addColumn("users", "username", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    }).catch(() => {});

    // Add a partial unique index for non-null usernames (Postgres)
    try {
      await queryInterface.addIndex("users", ["username"], {
        unique: true,
        name: "users_username_unique_idx",
        where: Sequelize.literal("username IS NOT NULL"),
      });
    } catch (e) {
      // ignore if index already exists
    }
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeIndex("users", "users_username_unique_idx"); } catch (e) {}
    await queryInterface.removeColumn("users", "username").catch(() => {});
  },
};
