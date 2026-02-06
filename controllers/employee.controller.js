// controllers/employee.controller.js - Simplified Employee Controller
const { Employee, Attendance } = require("../models/relations");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;

    // Check if employee ID already exists
    if (employeeData.employeeId) {
      const existingEmployee = await Employee.findOne({
        where: { employeeId: employeeData.employeeId }
      });
      if (existingEmployee) {
        return res.status(400).json({
          message: "Employee ID already exists"
        });
      }
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({
      where: { email: employeeData.email }
    });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    // Handle avatar upload
    if (req.file) {
      const extension = path.extname(req.file.originalname);
      const newFilename = `${uuidv4()}${extension}`;
      const newPath = path.join(__dirname, "../public/files", newFilename);
      await fs.rename(req.file.path, newPath);
      employeeData.avatar = `/files/${newFilename}`;
    }

    // Create employee
    const employee = await Employee.create(employeeData);

    res.status(201).json({
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get all employees with pagination and search
exports.getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department = '',
      status = '',
      workType = ''
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } },
        { designation: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (department) whereClause.department = department;
    if (status) whereClause.status = status;
    if (workType) whereClause.workType = workType;

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      employees: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if employee exists
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== employee.email) {
      const existingEmail = await Employee.findOne({
        where: { email: updateData.email }
      });
      if (existingEmail) {
        return res.status(400).json({
          message: "Email already exists"
        });
      }
    }

    // Check if employee ID is being changed and if it's already taken
    if (updateData.employeeId && updateData.employeeId !== employee.employeeId) {
      const existingId = await Employee.findOne({
        where: { employeeId: updateData.employeeId }
      });
      if (existingId) {
        return res.status(400).json({
          message: "Employee ID already exists"
        });
      }
    }

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar if exists
      if (employee.avatar) {
        const oldAvatarPath = path.join(__dirname, "../public", employee.avatar);
        try {
          await fs.unlink(oldAvatarPath);
        } catch (err) {
          console.log('Old avatar delete error:', err);
        }
      }

      // Save new avatar
      const extension = path.extname(req.file.originalname);
      const newFilename = `${uuidv4()}${extension}`;
      const newPath = path.join(__dirname, "../public/files", newFilename);
      await fs.rename(req.file.path, newPath);
      updateData.avatar = `/files/${newFilename}`;
    }

    // Update employee
    await employee.update(updateData);

    res.json({
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Delete avatar file if exists
    if (employee.avatar) {
      const avatarPath = path.join(__dirname, "../public", employee.avatar);
      try {
        await fs.unlink(avatarPath);
      } catch (err) {
        console.log('Avatar delete error:', err);
      }
    }

    await employee.destroy();

    res.json({
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get employee statistics
exports.getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.count();
    const activeEmployees = await Employee.count({ where: { status: 'active' } });
    const remoteEmployees = await Employee.count({ where: { workType: 'remote' } });
    const officeEmployees = await Employee.count({ where: { workType: 'office' } });

    // Department distribution
    const departmentStats = await Employee.findAll({
      attributes: [
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('department')), 'count']
      ],
      where: { department: { [Op.ne]: null } },
      group: ['department'],
      raw: true
    });

    res.json({
      total: totalEmployees,
      active: activeEmployees,
      remote: remoteEmployees,
      office: officeEmployees,
      departments: departmentStats
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};