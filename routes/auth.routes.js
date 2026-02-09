// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const {
  login,
  verify2FA,
  refreshToken,
  create,
  sendForgotPassword,
  verifyCode,
  changePass,
  userMe,
  updateMe,
  setPassword,
} = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { validateRegister } = require("../middlewares/validate.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         role:
 *           type: string
 *           enum: [admin, hr, manager, designer, developer, employee]
 *           description: User role (in JWT and /user/me)
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", validateRegister, login);

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify 2FA code and complete login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, pending2FAToken]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *               pending2FAToken: { type: string }
 *     responses:
 *       200: { description: Login successful, returns accessToken and user }
 *       400: { description: Invalid or expired code }
 */
router.post("/verify-2fa", verify2FA);

/**
 * @swagger
 * /api/auth/create:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists
 */
router.post("/create", validateRegister, create);

/**
 * @swagger
 * /api/auth/user/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/user/me", authenticateToken, userMe);

/**
 * @swagger
 * /api/auth/user/me:
 *   patch:
 *     summary: Update current user (e.g. 2FA preference)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twoFactorEnabled: { type: boolean }
 *     responses:
 *       200: { description: Updated user }
 */
router.patch("/user/me", authenticateToken, updateMe);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   get:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.get("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send forgot password email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset code sent to email
 *       404:
 *         description: Email not found
 */
router.post("/forgot-password", sendForgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Verify reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code verified successfully
 *       400:
 *         description: Invalid code
 */
router.post("/reset-password", verifyCode);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid code or email
 */
router.post("/change-password", changePass);

// Invite set-password flow (employee account activation)
/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: Set password via invite token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Activated
 *       400:
 *         description: Invalid/expired token
 *       404:
 *         description: Token not found
 */
router.post("/set-password", setPassword);

module.exports = router;
