// controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {
  User,
  ResetCode,
  RefreshToken,
  InviteToken,
  EmployeeAccount,
  Employee,
  EmployeeProfessional,
  Department,
  OfficeLocation,
} = require("../models/relations");
const { hashedPassword } = require("../utils/hash");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const {
  findRefreshToken,
  addRefreshToken,
  resetToken,
  generateCode,
} = require("../utils/token");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const payload = {
      userId: user.id,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await addRefreshToken(refreshToken, user.id);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      // Frontend (Vercel) and backend (Render) are on different origins in production,
      // so we must use SameSite=None + Secure for cookies to be sent.
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    user.refreshToken = refreshToken;
    await user.save();

    const userSafe = user.toJSON();
    delete userSafe.password;
    res.json({ accessToken, user: userSafe });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.userMe = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = await EmployeeAccount.findOne({
      where: { userId: user.id },
      attributes: ["id", "employeeId", "loginEmail", "status", "slackId", "skypeId", "githubId"],
      include: [
        {
          model: Employee,
          attributes: [
            "id",
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
            "avatarUrl",
          ],
          include: [
            {
              model: EmployeeProfessional,
              attributes: ["employeeIdCode", "username", "employeeType", "workEmail", "designation", "workingDays", "joiningDate"],
              include: [
                { model: Department, attributes: ["id", "name"], required: false },
                { model: OfficeLocation, attributes: ["id", "name"], required: false },
              ],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    const userJson = user.toJSON();
    const employee = account?.Employee ? account.Employee.toJSON() : null;
    const professional = employee?.EmployeeProfessional || null;

    // Flatten commonly needed fields for frontend convenience
    const firstName = employee?.firstName || null;
    const lastName = employee?.lastName || null;
    const avatarUrl = employee?.avatarUrl || null;
    const designation = professional?.designation || null;
    const department = professional?.Department || null;

    res.status(200).json({
      ...userJson,
      firstName,
      lastName,
      avatarUrl,
      designation,
      department,
      account: account ? {
        id: account.id,
        employeeId: account.employeeId,
        loginEmail: account.loginEmail,
        status: account.status,
        slackId: account.slackId,
        skypeId: account.skypeId,
        githubId: account.githubId,
      } : null,
      employee,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existUser = await User.findOne({ where: { email } });
    if (existUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = await hashedPassword(password);

    const newUser = await User.create({
      email,
      password: hash,
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.sendForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const existEmail = await User.findOne({ where: { email } });
    if (!existEmail) {
      return res.status(404).json({ message: "Email is not defined!" });
    }
    const verificationCode = generateCode();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    await ResetCode.destroy({ where: { email } });

    await ResetCode.create({
      email,
      code: verificationCode,
      expiry: expiryTime,
    });

    // For development/testing, you can enable actual email sending
    // Uncomment the next lines to test real email sending
    /*
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔧 DEV MODE: Verification code for ${email}: ${verificationCode}`);
      return res.json({
        message: "Tasdiqlash kodi emailga yuborildi (DEV MODE)",
        code: verificationCode // Only for development
      });
    }
    */

    // Production email sending
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Tasdiqlash kodi",
      text: `Parol tiklash uchun sizning 6 xonali tasdiqlash kodingiz: ${verificationCode}\n\nBu kod 10 daqiqa davomida amal qiladi.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({ message: "Email yuborishda xatolik" });
      } else {
        return res.json({ message: "Tasdiqlash kodi emailga yuborildi" });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  try {
    const record = await ResetCode.findOne({ where: { email } });
    if (!record) {
      return res.status(400).json({ message: "Xatolik!" });
    }

    if (record.code !== code) {
      return res.status(400).json({ message: "The code is incorrect." });
    }

    if (new Date() > record.expiry) {
      return res.status(400).json({ message: "Kod muddati tugagan" });
    }

    // await ResetCode.destroy({ where: { email } });

    res.json({ message: "Kod tasdiqlandi" });
  } catch (error) {
    res.status(500).json({ message: "Server xatoligi" });
  }
};
exports.changePass = async (req, res) => {
  const { password, code, email } = req.body;

  try {
    const existEmail = await User.findOne({ where: { email } });
    if (!existEmail) {
      return res.status(404).json({ message: "Email not found!" });
    }

    const record = await ResetCode.findOne({ where: { email } });
    if (!record) {
      return res.status(400).json({ message: "The code is not found!" });
    }

    if (record.code !== code) {
      return res.status(400).json({ message: "The code is incorrect." });
    }

    const hashed = await hashedPassword(password);

    await User.update({ password: hashed }, { where: { email } });

    await ResetCode.destroy({ where: { email } });

    return res.status(200).json({ message: "Password successfully changed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }
  try {
    const existToken = await RefreshToken.findOne({
      where: { token: refreshToken },
    });

    if (!existToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken({ userId: existToken.userId });

    return res.json({ accessToken });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// POST /api/auth/set-password
// Body: { token, newPassword }
exports.setPassword = async (req, res) => {
  const { token, newPassword } = req.body || {};
  try {
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token is required" });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const invite = await InviteToken.findOne({ where: { token } });
    if (!invite) return res.status(404).json({ message: "Invalid token" });
    if (invite.usedAt) return res.status(400).json({ message: "Token already used" });
    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ message: "Token expired" });
    }

    const account = await EmployeeAccount.findOne({ where: { employeeId: invite.employeeId } });
    if (!account) return res.status(404).json({ message: "Employee account not found" });

    const email = account.loginEmail;
    const hash = await hashedPassword(newPassword);

    let user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({ password: hash });
    } else {
      user = await User.create({ email, password: hash });
    }

    await account.update({ userId: user.id, status: "active" });
    await invite.update({ usedAt: new Date() });

    return res.status(200).json({ message: "Password set", status: "active" });
  } catch (error) {
    console.error("setPassword error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
