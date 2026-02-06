const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email noto‘g‘ri formatda')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('Parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      }));
      return res.status(422).json({ message: extractedErrors[0].message, errors: extractedErrors });
    }
    next();
  },
];

const employeeValidationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(422).json({
      message: extractedErrors[0].message,
      errors: extractedErrors,
    });
  }
  next();
};

// CREATE uchun minimal majburiylar:
// - stepOne: firstName, lastName, mobileNumber, emailAddress
// - stepTwo: employeeid, employeeType, department, designation, joiningDate, workLocation
// Qolganlari optional (agar kelsa format tekshiriladi).
const employeeCreateValidation = [
  // Step One (required)
  body("stepOne.firstName").notEmpty().withMessage("Ism majburiy"),
  body("stepOne.lastName").notEmpty().withMessage("Familiya majburiy"),
  body("stepOne.mobileNumber").notEmpty().withMessage("Telefon raqami majburiy"),
  body("stepOne.emailAddress")
    .notEmpty()
    .withMessage("Email majburiy")
    .bail()
    .isEmail()
    .withMessage("Email noto‘g‘ri formatda")
    .normalizeEmail(),

  // Step One (optional)
  body("stepOne.dateOfBirth").optional({ checkFalsy: true }).isString(),
  body("stepOne.maritalStatus").optional({ checkFalsy: true }).isString(),
  body("stepOne.gender").optional({ checkFalsy: true }).isString(),
  body("stepOne.nationality").optional({ checkFalsy: true }).isString(),
  body("stepOne.address").optional({ checkFalsy: true }).isString(),
  body("stepOne.city").optional({ checkFalsy: true }).isString(),
  body("stepOne.state").optional({ checkFalsy: true }).isString(),
  body("stepOne.zipCode").optional({ checkFalsy: true }).isString(),

  // Step Two (required)
  body("stepTwo.employeeid").notEmpty().withMessage("Xodim ID majburiy"),
  body("stepTwo.employeeType").notEmpty().withMessage("Xodim turi majburiy"),
  body("stepTwo.department").notEmpty().withMessage("Bo‘lim majburiy"),
  body("stepTwo.designation").notEmpty().withMessage("Lavozim majburiy"),
  body("stepTwo.joiningDate").notEmpty().withMessage("Ishga qo‘shilgan sana majburiy"),
  body("stepTwo.workLocation").notEmpty().withMessage("Ish joyi majburiy"),

  // Step Two (optional)
  body("stepTwo.userName").optional({ checkFalsy: true }).isString(),
  body("stepTwo.workDays").optional({ checkFalsy: true }).isString(),
  body("stepTwo.emailAddress")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Step Two email noto‘g‘ri formatda")
    .normalizeEmail(),

  // Step Three (optional, structure only)
  body("stepThree.view.appointmentLetter").optional().isArray(),
  body("stepThree.view.relivingLetter").optional().isArray(),
  body("stepThree.view.salarySlips").optional().isArray(),
  body("stepThree.view.experienceLetter").optional().isArray(),
  body("stepThree.delete.appointmentLetter").optional().isArray(),
  body("stepThree.delete.relivingLetter").optional().isArray(),
  body("stepThree.delete.salarySlips").optional().isArray(),
  body("stepThree.delete.experienceLetter").optional().isArray(),

  // Step Four (optional)
  body("stepFour.email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Step Four email noto‘g‘ri formatda")
    .normalizeEmail(),
  body("stepFour.slackId").optional({ checkFalsy: true }).isString(),
  body("stepFour.skypeId").optional({ checkFalsy: true }).isString(),
  body("stepFour.githubId").optional({ checkFalsy: true }).isString(),

  employeeValidationErrorHandler,
];

// UPDATE uchun hammasi optional; kelsa format tekshiriladi.
const employeeUpdateValidation = [
  body("stepOne.firstName").optional({ checkFalsy: true }).isString(),
  body("stepOne.lastName").optional({ checkFalsy: true }).isString(),
  body("stepOne.mobileNumber").optional({ checkFalsy: true }).isString(),
  body("stepOne.emailAddress")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Email noto‘g‘ri formatda")
    .normalizeEmail(),
  body("stepOne.dateOfBirth").optional({ checkFalsy: true }).isString(),
  body("stepOne.maritalStatus").optional({ checkFalsy: true }).isString(),
  body("stepOne.gender").optional({ checkFalsy: true }).isString(),
  body("stepOne.nationality").optional({ checkFalsy: true }).isString(),
  body("stepOne.address").optional({ checkFalsy: true }).isString(),
  body("stepOne.city").optional({ checkFalsy: true }).isString(),
  body("stepOne.state").optional({ checkFalsy: true }).isString(),
  body("stepOne.zipCode").optional({ checkFalsy: true }).isString(),

  body("stepTwo.employeeid").optional({ checkFalsy: true }).isString(),
  body("stepTwo.userName").optional({ checkFalsy: true }).isString(),
  body("stepTwo.employeeType").optional({ checkFalsy: true }).isString(),
  body("stepTwo.emailAddress").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("stepTwo.department").optional({ checkFalsy: true }).isString(),
  body("stepTwo.designation").optional({ checkFalsy: true }).isString(),
  body("stepTwo.workDays").optional({ checkFalsy: true }).isString(),
  body("stepTwo.joiningDate").optional({ checkFalsy: true }).isString(),
  body("stepTwo.workLocation").optional({ checkFalsy: true }).isString(),

  body("stepThree.view.appointmentLetter").optional().isArray(),
  body("stepThree.view.relivingLetter").optional().isArray(),
  body("stepThree.view.salarySlips").optional().isArray(),
  body("stepThree.view.experienceLetter").optional().isArray(),
  body("stepThree.delete.appointmentLetter").optional().isArray(),
  body("stepThree.delete.relivingLetter").optional().isArray(),
  body("stepThree.delete.salarySlips").optional().isArray(),
  body("stepThree.delete.experienceLetter").optional().isArray(),

  body("stepFour.email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("stepFour.slackId").optional({ checkFalsy: true }).isString(),
  body("stepFour.skypeId").optional({ checkFalsy: true }).isString(),
  body("stepFour.githubId").optional({ checkFalsy: true }).isString(),

  employeeValidationErrorHandler,
];

module.exports = { validateRegister, employeeCreateValidation, employeeUpdateValidation };