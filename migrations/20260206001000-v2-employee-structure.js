'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lookups
    await queryInterface.createTable('Departments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('OfficeLocations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    // Employees table: add personal fields (nullable for backwards compatibility)
    const employeeColumns = [
      ['firstName', Sequelize.STRING],
      ['lastName', Sequelize.STRING],
      ['mobileNumber', Sequelize.STRING],
      ['personalEmail', Sequelize.STRING],
      ['dateOfBirth', Sequelize.STRING],
      ['maritalStatus', Sequelize.STRING],
      ['gender', Sequelize.STRING],
      ['nationality', Sequelize.STRING],
      ['address', Sequelize.STRING],
      ['city', Sequelize.STRING],
      ['state', Sequelize.STRING],
      ['zipCode', Sequelize.STRING],
      ['avatarUrl', Sequelize.STRING],
    ];
    for (const [name, type] of employeeColumns) {
      await queryInterface.addColumn('Employees', name, { type, allowNull: true });
    }

    // EmployeeProfessional
    await queryInterface.createTable('EmployeeProfessional', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      employeeId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Employees', key: 'id' },
        onDelete: 'CASCADE',
      },
      employeeIdCode: { type: Sequelize.STRING, allowNull: false, unique: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      employeeType: { type: Sequelize.STRING, allowNull: false },
      workEmail: { type: Sequelize.STRING, allowNull: false, unique: true },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Departments', key: 'id' },
      },
      designation: { type: Sequelize.STRING, allowNull: false },
      workingDays: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      joiningDate: { type: Sequelize.STRING, allowNull: false },
      officeLocationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'OfficeLocations', key: 'id' },
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    // EmployeeDocuments
    await queryInterface.createTable('EmployeeDocuments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      employeeId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Employees', key: 'id' },
        onDelete: 'CASCADE',
      },
      appointmentLetterUrl: { type: Sequelize.STRING, allowNull: false },
      salarySlipUrls: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      relievingLetterUrls: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      experienceLetterUrls: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    // EmployeeAccounts
    await queryInterface.createTable('EmployeeAccounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      employeeId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Employees', key: 'id' },
        onDelete: 'CASCADE',
      },
      loginEmail: { type: Sequelize.STRING, allowNull: false, unique: true },
      userId: { type: Sequelize.UUID, allowNull: true, unique: true },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'disabled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      slackId: { type: Sequelize.STRING, allowNull: true },
      skypeId: { type: Sequelize.STRING, allowNull: true },
      githubId: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    // InviteTokens
    await queryInterface.createTable('InviteTokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      employeeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Employees', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: { type: Sequelize.STRING, allowNull: false, unique: true },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      usedAt: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InviteTokens');
    await queryInterface.dropTable('EmployeeAccounts');
    await queryInterface.dropTable('EmployeeDocuments');
    await queryInterface.dropTable('EmployeeProfessional');

    // remove added columns from Employees
    const employeeColumns = [
      'firstName',
      'lastName',
      'mobileNumber',
      'personalEmail',
      'dateOfBirth',
      'maritalStatus',
      'gender',
      'nationality',
      'address',
      'city',
      'state',
      'zipCode',
      'avatarUrl',
    ];
    for (const name of employeeColumns) {
      await queryInterface.removeColumn('Employees', name);
    }

    await queryInterface.dropTable('OfficeLocations');
    await queryInterface.dropTable('Departments');

    // cleanup enum type (Postgres)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_EmployeeAccounts_status";');
  },
};

