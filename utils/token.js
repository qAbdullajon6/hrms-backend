const jwt = require("jsonwebtoken");
const { RefreshToken } = require("../models/relations");

const addRefreshToken = async (token, userId) => {
  const decoded = jwt.decode(token);
  const expiryDate = new Date(decoded.exp * 1000);

  // Eski tokenlarni tozalash
  await RefreshToken.destroy({ where: { userId } });

  return await RefreshToken.create({ token, userId, expiryDate });
};

const resetToken = async (payload) => {
  return await jwt.sign(payload, process.env.RESET_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

const generateCode = () => Math.floor(10000 + Math.random() * 90000); 

const removeRefreshToken = async (token) => {
  return await RefreshToken.destroy({ where: { token } });
};

const findRefreshToken = async (userId) => {
  return await RefreshToken.findOne({ where: { userId } });
};

module.exports = { addRefreshToken, removeRefreshToken, findRefreshToken, resetToken, generateCode };
