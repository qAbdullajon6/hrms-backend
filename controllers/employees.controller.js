const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelize = require("../config/db");
const {
  Employee,
  EmployeeProfessional,
  EmployeeDocuments,
  EmployeeAccount,
  InviteToken,
  Department,
  OfficeLocation,
} = require("../models/relations");
const { sendEmail } = require("../utils/sendEmail");

function parseJsonField(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeEmployeeIdCode(value) {
  return value ? value.toString().trim().toUpperCase() : "";
}

function buildInviteLink(token) {
  const base = process.env.CLIENT_URL || "http://localhost:3000";
  return `${base}/set-password?token=${encodeURIComponent(token)}`;
}

function employeeIncludes() {
  return [
    {
      model: EmployeeProfessional,
      required: false,
      include: [{ model: Department, required: false }, { model: OfficeLocation, required: false }],
    },
    { model: EmployeeDocuments, required: false },
    { model: EmployeeAccount, required: false },
  ];
}

exports.checkEmployeeId = async (req, res) => {
  try {
    const employeeId = normalizeEmployeeIdCode(req.query.employeeId || "");
    const excludeEmployeeId = req.query.excludeEmployeeId
      ? req.query.excludeEmployeeId.toString()
      : null;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required", available: false });
    }

    const where = excludeEmployeeId
      ? { employeeIdCode: employeeId, employeeId: { [Op.ne]: excludeEmployeeId } }
      : { employeeIdCode: employeeId };

    const exists = await EmployeeProfessional.findOne({ where });
    return res.status(200).json({ employeeId, available: !exists });
  } catch (error) {
    console.error("checkEmployeeId error:", error);
    return res.status(500).json({ message: "Server error", available: false });
  }
};

exports.createEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Accept either spec keys or legacy keys
    const personal = parseJsonField(req.body.personal ?? req.body.stepOne, {});
    const professional = parseJsonField(req.body.professional ?? req.body.stepTwo, {});
    const documents = parseJsonField(req.body.documents ?? req.body.stepThree, {});
    const accountAccess = parseJsonField(req.body.accountAccess ?? req.body.stepFour, {});

    // Required fields (spec)
    const requiredPersonal = [
      "firstName",
      "lastName",
      "mobileNumber",
      "personalEmail",
      "dateOfBirth",
      "maritalStatus",
      "gender",
      "address",
      "city",
    ];
    for (const f of requiredPersonal) {
      if (!personal?.[f]) {
        await transaction.rollback();
        return res.status(422).json({ message: `${f} is required`, field: `personal.${f}` });
      }
    }

    const employeeIdCode = normalizeEmployeeIdCode(
      professional.employeeId ?? professional.employeeid ?? ""
    );
    if (!employeeIdCode) {
      await transaction.rollback();
      return res.status(422).json({ message: "employeeId is required", field: "professional.employeeId" });
    }
    if (!professional.username) {
      await transaction.rollback();
      return res.status(422).json({ message: "username is required", field: "professional.username" });
    }
    if (!professional.employeeType) {
      await transaction.rollback();
      return res.status(422).json({ message: "employeeType is required", field: "professional.employeeType" });
    }
    if (!professional.workEmail) {
      await transaction.rollback();
      return res.status(422).json({ message: "workEmail is required", field: "professional.workEmail" });
    }
    if (!professional.departmentId) {
      await transaction.rollback();
      return res.status(422).json({ message: "departmentId is required", field: "professional.departmentId" });
    }
    if (!professional.designation) {
      await transaction.rollback();
      return res.status(422).json({ message: "designation is required", field: "professional.designation" });
    }
    if (!professional.workingDays || !Array.isArray(professional.workingDays) || professional.workingDays.length === 0) {
      await transaction.rollback();
      return res.status(422).json({ message: "workingDays is required", field: "professional.workingDays" });
    }
    if (!professional.joiningDate) {
      await transaction.rollback();
      return res.status(422).json({ message: "joiningDate is required", field: "professional.joiningDate" });
    }
    if (!professional.officeLocationId) {
      await transaction.rollback();
      return res.status(422).json({ message: "officeLocationId is required", field: "professional.officeLocationId" });
    }

    const loginEmail = (accountAccess.loginEmail ?? accountAccess.email ?? "").toString().trim();
    if (!loginEmail) {
      await transaction.rollback();
      return res.status(422).json({ message: "loginEmail is required", field: "accountAccess.loginEmail" });
    }

    // Uniqueness checks
    const existingEmployeeId = await EmployeeProfessional.findOne({
      where: { employeeIdCode },
      transaction,
    });
    if (existingEmployeeId) {
      await transaction.rollback();
      return res.status(409).json({ message: "Employee ID already exists", field: "professional.employeeId" });
    }

    const existingWorkEmail = await EmployeeProfessional.findOne({
      where: { workEmail: professional.workEmail.toString().trim().toLowerCase() },
      transaction,
    });
    if (existingWorkEmail) {
      await transaction.rollback();
      return res.status(409).json({ message: "Work email already exists", field: "professional.workEmail" });
    }

    const existingLoginEmail = await EmployeeAccount.findOne({
      where: { loginEmail: loginEmail.toLowerCase() },
      transaction,
    });
    if (existingLoginEmail) {
      await transaction.rollback();
      return res.status(409).json({ message: "Login email already exists", field: "accountAccess.loginEmail" });
    }

    // Files
    const files = req.files || {};
    const avatarImage = files.avatarImage?.[0] || null;
    const appointment = files.appointmentLetter?.[0] || null;
    if (!appointment) {
      await transaction.rollback();
      return res.status(422).json({ message: "appointmentLetter is required", field: "documents.appointmentLetter" });
    }

    const avatarUrl = avatarImage ? `/files/${avatarImage.filename}` : null;
    const appointmentLetterUrl = `/files/${appointment.filename}`;
    const salarySlipUrls = (files.salarySlips || []).map((f) => `/files/${f.filename}`);
    const relievingLetterUrls = (files.relivingLetter || []).map((f) => `/files/${f.filename}`);
    const experienceLetterUrls = (files.experienceLetter || []).map((f) => `/files/${f.filename}`);

    // Create records
    const employee = await Employee.create(
      {
        firstName: personal.firstName,
        lastName: personal.lastName,
        mobileNumber: personal.mobileNumber,
        personalEmail: personal.personalEmail,
        dateOfBirth: personal.dateOfBirth,
        maritalStatus: personal.maritalStatus,
        gender: personal.gender,
        nationality: personal.nationality || null,
        address: personal.address,
        city: personal.city,
        state: personal.state || null,
        zipCode: personal.zipCode || null,
        avatarUrl,
      },
      { transaction }
    );

    await EmployeeProfessional.create(
      {
        employeeId: employee.id,
        employeeIdCode,
        username: professional.username,
        employeeType: professional.employeeType,
        workEmail: professional.workEmail.toString().trim().toLowerCase(),
        departmentId: professional.departmentId,
        designation: professional.designation,
        workingDays: professional.workingDays,
        joiningDate: professional.joiningDate,
        officeLocationId: professional.officeLocationId,
      },
      { transaction }
    );

    await EmployeeDocuments.create(
      {
        employeeId: employee.id,
        appointmentLetterUrl,
        salarySlipUrls,
        relievingLetterUrls,
        experienceLetterUrls,
      },
      { transaction }
    );

    await EmployeeAccount.create(
      {
        employeeId: employee.id,
        loginEmail: loginEmail.toLowerCase(),
        status: "pending",
        slackId: accountAccess.slackId || null,
        skypeId: accountAccess.skypeId || null,
        githubId: accountAccess.githubId || null,
      },
      { transaction }
    );

    // Invite token + email
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await InviteToken.create(
      {
        employeeId: employee.id,
        token,
        expiresAt,
      },
      { transaction }
    );

    await transaction.commit();

    // Send email after commit
    const inviteLink = buildInviteLink(token);
    await sendEmail({
      to: loginEmail,
      subject: "Welcome to HRMS — Set your password",
      text: `Hello ${employee.firstName},\n\nYour HRMS account has been created.\n\nSet your password using this link:\n${inviteLink}\n\nThis link expires in 24 hours.`,
    });

    return res.status(201).json({
      message: "Employee created. Invite sent.",
      employeeId: employee.id,
      accountStatus: "pending",
    });
  } catch (error) {
    console.error("employees.createEmployee error:", error);
    await transaction.rollback();
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, { include: employeeIncludes() });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    return res.status(200).json(employee);
  } catch (error) {
    console.error("employees.getEmployeeById error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // IMPORTANT (Postgres): FOR UPDATE cannot be used with OUTER JOIN.
    // Lock only the Employees row; load relations separately.
    const employee = await Employee.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    const personal = parseJsonField(req.body.personal ?? req.body.stepOne, {});
    const professional = parseJsonField(req.body.professional ?? req.body.stepTwo, {});
    const documents = parseJsonField(req.body.documents ?? req.body.stepThree, {});
    const accountAccess = parseJsonField(req.body.accountAccess ?? req.body.stepFour, {});

    // Files
    const files = req.files || {};
    const avatarImage = files.avatarImage?.[0] || null;
    const appointment = files.appointmentLetter?.[0] || null;
    const salarySlipUrlsNew = (files.salarySlips || []).map((f) => `/files/${f.filename}`);
    const relievingLetterUrlsNew = (files.relivingLetter || []).map((f) => `/files/${f.filename}`);
    const experienceLetterUrlsNew = (files.experienceLetter || []).map((f) => `/files/${f.filename}`);

    // Update personal fields (only if provided)
    const personalPatch = {};
    const personalFields = [
      "firstName",
      "lastName",
      "mobileNumber",
      "personalEmail",
      "dateOfBirth",
      "maritalStatus",
      "gender",
      "nationality",
      "address",
      "city",
      "state",
      "zipCode",
    ];
    for (const f of personalFields) {
      if (personal?.[f] !== undefined) personalPatch[f] = personal[f];
    }

    if (avatarImage) {
      personalPatch.avatarUrl = `/files/${avatarImage.filename}`;
    } else if (req.body.isDeleteAvatar === "true" || req.body.isDeleteAvatar === true) {
      personalPatch.avatarUrl = null;
    }

    if (Object.keys(personalPatch).length) {
      await employee.update(personalPatch, { transaction });
    }

    // Update professional
    let prof = await EmployeeProfessional.findOne({ where: { employeeId: employee.id }, transaction });
    if (!prof) {
      prof = await EmployeeProfessional.create({ employeeId: employee.id }, { transaction });
    }

    const employeeIdCode = professional.employeeId || professional.employeeid ? normalizeEmployeeIdCode(professional.employeeId ?? professional.employeeid) : null;
    if (employeeIdCode && employeeIdCode !== prof.employeeIdCode) {
      const exists = await EmployeeProfessional.findOne({
        where: { employeeIdCode, employeeId: { [Op.ne]: employee.id } },
        transaction,
      });
      if (exists) {
        await transaction.rollback();
        return res.status(409).json({ message: "Employee ID already exists", field: "professional.employeeId" });
      }
    }

    const workEmail = professional.workEmail ? professional.workEmail.toString().trim().toLowerCase() : null;
    if (workEmail && workEmail !== prof.workEmail) {
      const exists = await EmployeeProfessional.findOne({
        where: { workEmail, employeeId: { [Op.ne]: employee.id } },
        transaction,
      });
      if (exists) {
        await transaction.rollback();
        return res.status(409).json({ message: "Work email already exists", field: "professional.workEmail" });
      }
    }

    const username = professional.username ? professional.username.toString().trim() : null;
    if (username && username !== prof.username) {
      const exists = await EmployeeProfessional.findOne({
        where: { username, employeeId: { [Op.ne]: employee.id } },
        transaction,
      });
      if (exists) {
        await transaction.rollback();
        return res.status(409).json({ message: "Username already exists", field: "professional.username" });
      }
    }

    const profPatch = {};
    if (employeeIdCode) profPatch.employeeIdCode = employeeIdCode;
    if (username) profPatch.username = username;
    if (professional.employeeType !== undefined) profPatch.employeeType = professional.employeeType;
    if (workEmail) profPatch.workEmail = workEmail;
    if (professional.departmentId !== undefined) profPatch.departmentId = professional.departmentId;
    if (professional.designation !== undefined) profPatch.designation = professional.designation;
    if (professional.workingDays !== undefined) profPatch.workingDays = professional.workingDays;
    if (professional.joiningDate !== undefined) profPatch.joiningDate = professional.joiningDate;
    if (professional.officeLocationId !== undefined) profPatch.officeLocationId = professional.officeLocationId;

    if (Object.keys(profPatch).length) {
      await prof.update(profPatch, { transaction });
    }

    // Update documents
    let docs = await EmployeeDocuments.findOne({ where: { employeeId: employee.id }, transaction });
    if (!docs) {
      if (!appointment) {
        await transaction.rollback();
        return res.status(422).json({ message: "appointmentLetter is required", field: "documents.appointmentLetter" });
      }
      docs = await EmployeeDocuments.create(
        {
          employeeId: employee.id,
          appointmentLetterUrl: `/files/${appointment.filename}`,
          salarySlipUrls: [],
          relievingLetterUrls: [],
          experienceLetterUrls: [],
        },
        { transaction }
      );
    }

    const docsJson = documents || {};
    const docsDelete = docsJson.delete || docsJson?.deleteUrls || {};

    const currentSalary = Array.isArray(docs.salarySlipUrls) ? docs.salarySlipUrls : [];
    const currentRelieving = Array.isArray(docs.relievingLetterUrls) ? docs.relievingLetterUrls : [];
    const currentExperience = Array.isArray(docs.experienceLetterUrls) ? docs.experienceLetterUrls : [];

    const filteredSalary = Array.isArray(docsDelete.salarySlips)
      ? currentSalary.filter((u) => !docsDelete.salarySlips.includes(u))
      : currentSalary;
    const filteredRelieving = Array.isArray(docsDelete.relivingLetter)
      ? currentRelieving.filter((u) => !docsDelete.relivingLetter.includes(u))
      : currentRelieving;
    const filteredExperience = Array.isArray(docsDelete.experienceLetter)
      ? currentExperience.filter((u) => !docsDelete.experienceLetter.includes(u))
      : currentExperience;

    const docsPatch = {
      appointmentLetterUrl: appointment ? `/files/${appointment.filename}` : docs.appointmentLetterUrl,
      salarySlipUrls: [...filteredSalary, ...salarySlipUrlsNew],
      relievingLetterUrls: [...filteredRelieving, ...relievingLetterUrlsNew],
      experienceLetterUrls: [...filteredExperience, ...experienceLetterUrlsNew],
    };

    await docs.update(docsPatch, { transaction });

    // Update account access
    let account = await EmployeeAccount.findOne({ where: { employeeId: employee.id }, transaction });
    if (!account) {
      const initEmail = (accountAccess.loginEmail ?? accountAccess.email ?? "").toString().trim().toLowerCase();
      if (!initEmail) {
        await transaction.rollback();
        return res.status(422).json({ message: "loginEmail is required", field: "accountAccess.loginEmail" });
      }
      account = await EmployeeAccount.create(
        { employeeId: employee.id, loginEmail: initEmail, status: "pending" },
        { transaction }
      );
    }

    const loginEmail = (accountAccess.loginEmail ?? accountAccess.email ?? "").toString().trim().toLowerCase();
    if (loginEmail && loginEmail !== account.loginEmail) {
      const exists = await EmployeeAccount.findOne({
        where: { loginEmail, employeeId: { [Op.ne]: employee.id } },
        transaction,
      });
      if (exists) {
        await transaction.rollback();
        return res.status(409).json({ message: "Login email already exists", field: "accountAccess.loginEmail" });
      }
      await account.update({ loginEmail }, { transaction });
    }

    const accPatch = {};
    if (accountAccess.slackId !== undefined) accPatch.slackId = accountAccess.slackId || null;
    if (accountAccess.skypeId !== undefined) accPatch.skypeId = accountAccess.skypeId || null;
    if (accountAccess.githubId !== undefined) accPatch.githubId = accountAccess.githubId || null;
    if (Object.keys(accPatch).length) await account.update(accPatch, { transaction });

    await transaction.commit();

    const updated = await Employee.findByPk(employee.id, { include: employeeIncludes() });
    return res.status(200).json({ message: "Employee updated", employee: updated });
  } catch (error) {
    console.error("employees.updateEmployee error:", error);
    await transaction.rollback();
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    await InviteToken.destroy({ where: { employeeId: id }, transaction });
    await EmployeeAccount.destroy({ where: { employeeId: id }, transaction });
    await EmployeeDocuments.destroy({ where: { employeeId: id }, transaction });
    await EmployeeProfessional.destroy({ where: { employeeId: id }, transaction });
    await Employee.destroy({ where: { id }, transaction });

    await transaction.commit();
    return res.status(200).json({ message: "Employee deleted" });
  } catch (error) {
    console.error("employees.deleteEmployee error:", error);
    await transaction.rollback();
    return res.status(500).json({ message: "Server error" });
  }
};

exports.listEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const departmentIdsRaw = (req.query.departmentIds || "").toString().trim();
    const workMode = (req.query.workMode || "").toString().trim().toLowerCase(); // "office" | "remote"

    const whereEmployee = {};
    const whereProfessional = {};

    if (search) {
      whereEmployee[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { personalEmail: { [Op.iLike]: `%${search}%` } },
      ];
      whereProfessional[Op.or] = [
        { employeeIdCode: { [Op.iLike]: `%${search}%` } },
        { workEmail: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Filter: departmentIds=uuid,uuid,...
    if (departmentIdsRaw) {
      const ids = departmentIdsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length) {
        whereProfessional.departmentId = { [Op.in]: ids };
      }
    }

    // Filter: workMode=office|remote (by OfficeLocation.name)
    const officeLocationInclude = { model: OfficeLocation, required: false };
    if (workMode === "remote") {
      officeLocationInclude.required = true;
      officeLocationInclude.where = { name: { [Op.iLike]: "%remote%" } };
    } else if (workMode === "office") {
      officeLocationInclude.required = true;
      officeLocationInclude.where = { name: { [Op.notILike]: "%remote%" } };
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: whereEmployee,
      include: [
        {
          model: EmployeeProfessional,
          where: Object.keys(whereProfessional).length ? whereProfessional : undefined,
          required: !!search || !!departmentIdsRaw || workMode === "remote" || workMode === "office",
          include: [
            { model: Department, required: false },
            officeLocationInclude,
          ],
        },
        { model: EmployeeDocuments, required: false },
        { model: EmployeeAccount, required: false },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      employees: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("employees.listEmployees error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.inviteEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const account = await EmployeeAccount.findOne({ where: { employeeId: id }, transaction });
    const employee = await Employee.findByPk(id, { transaction });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }
    if (!account) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee account not found" });
    }

    // invalidate old tokens (optional)
    await InviteToken.update({ usedAt: new Date() }, { where: { employeeId: id, usedAt: null }, transaction });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await InviteToken.create({ employeeId: id, token, expiresAt }, { transaction });

    await transaction.commit();

    const inviteLink = buildInviteLink(token);
    await sendEmail({
      to: account.loginEmail,
      subject: "HRMS — Set your password",
      text: `Hello ${employee.firstName},\n\nSet your password using this link:\n${inviteLink}\n\nThis link expires in 24 hours.`,
    });

    return res.status(200).json({ message: "Invite sent", inviteSent: true });
  } catch (error) {
    console.error("employees.inviteEmployee error:", error);
    await transaction.rollback();
    return res.status(500).json({ message: "Server error" });
  }
};

