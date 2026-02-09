"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Holidays", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("Candidates", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      avatarUrl: { type: Sequelize.STRING, allowNull: true },
      appliedFor: { type: Sequelize.STRING, allowNull: false },
      appliedDate: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      mobile: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.ENUM("Selected", "In Process", "Rejected"), allowNull: false, defaultValue: "In Process" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("Jobs", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      department: { type: Sequelize.STRING, allowNull: false },
      location: { type: Sequelize.STRING, allowNull: false },
      amountPerMonth: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM("active", "inactive", "completed"), allowNull: false, defaultValue: "active" },
      tags: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("Leaves", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: { type: Sequelize.UUID, allowNull: true },
      employeeName: { type: Sequelize.STRING, allowNull: false },
      avatarUrl: { type: Sequelize.STRING, allowNull: true },
      leaveType: { type: Sequelize.STRING, allowNull: false },
      fromDate: { type: Sequelize.DATEONLY, allowNull: false },
      toDate: { type: Sequelize.DATEONLY, allowNull: false },
      days: { type: Sequelize.STRING, allowNull: false },
      manager: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM("Pending", "Approved", "Rejected"), allowNull: false, defaultValue: "Pending" },
      reason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("Notifications", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      time: { type: Sequelize.STRING, allowNull: true },
      avatarUrl: { type: Sequelize.STRING, allowNull: true },
      icon: { type: Sequelize.ENUM("user", "briefcase", "lock", "alert"), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("Payrolls", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: { type: Sequelize.UUID, allowNull: true },
      name: { type: Sequelize.STRING, allowNull: false },
      avatarUrl: { type: Sequelize.STRING, allowNull: true },
      ctc: { type: Sequelize.STRING, allowNull: false },
      salaryPerMonth: { type: Sequelize.STRING, allowNull: false },
      deduction: { type: Sequelize.STRING, allowNull: true, defaultValue: "-" },
      status: { type: Sequelize.ENUM("Completed", "Pending"), allowNull: false, defaultValue: "Pending" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("ScheduleEvents", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      eventDate: { type: Sequelize.DATEONLY, allowNull: false },
      time: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      subtitle: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ScheduleEvents");
    await queryInterface.dropTable("Payrolls");
    await queryInterface.dropTable("Notifications");
    await queryInterface.dropTable("Leaves");
    await queryInterface.dropTable("Jobs");
    await queryInterface.dropTable("Candidates");
    await queryInterface.dropTable("Holidays");
  },
};
