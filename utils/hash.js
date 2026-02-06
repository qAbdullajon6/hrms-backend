const bcrypt = require('bcryptjs')

exports.hashedPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};
