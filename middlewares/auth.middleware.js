const jwt = require("jsonwebtoken");
const { hasRole } = require("../config/roles");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token not found" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Token invalid!" });
    req.user = user;
    next();
  });
}

/**
 * Require one of the given roles. Use after authenticateToken.
 * @param {string[]} allowedRoles - e.g. ['admin', 'hr']
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(403).json({ message: "Access denied. Role not found." });
    }
    if (!hasRole(role, allowedRoles)) {
      return res.status(403).json({ message: "Access denied. You do not have permission for this action." });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
