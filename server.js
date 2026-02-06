require("dotenv").config();
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const authRouter = require("./routes/auth.routes");
const employeesRouter = require("./routes/employees.routes");
const lookupsRouter = require("./routes/lookups.routes");
const dashboardRouter = require("./routes/dashboard.routes");
const { swaggerUi, specs } = require("./swagger");

function parseAllowedOrigins() {
  const raw = (process.env.CLIENT_URL || "").trim();
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list;
}

function corsOriginFn(allowed) {
  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

  return (origin, cb) => {
    // Non-browser requests (e.g. curl, server-to-server) won't send Origin
    if (!origin) return cb(null, true);

    if (allowed.includes(origin)) return cb(null, true);
    if (allowVercelPreviews && /^https:\/\/.+\.vercel\.app$/.test(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  };
}

async function starter() {
  try {
    console.log('🚀 Server ishga tushmoqda...');

    // Database ni initialize qilish
    const db = require("./config/db");
    console.log("🔄 Database initialization boshlanmoqda...");
    await db.initializeDatabase();
    console.log("✅ Database initialization tugadi");

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Ensure upload directory exists (Render filesystem is ephemeral)
    try {
      fs.mkdirSync(path.join(__dirname, "public", "files"), { recursive: true });
    } catch (e) {
      console.warn("⚠️ Could not ensure upload directory:", e?.message || e);
    }

    const allowedOrigins = parseAllowedOrigins();
    app.use(
      cors({
        origin: corsOriginFn(allowedOrigins),
        credentials: true,
      })
    );

    app.use(express.json({ limit: '50mb' }));
    app.use(cookieParser());

    app.use("/files", express.static("public/files"));

    // Swagger Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Routerlar
    app.use("/api/auth", authRouter);
    app.use("/api/employees", employeesRouter);
    app.use("/api/lookups", lookupsRouter);
    app.use("/api/dashboard", dashboardRouter);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });

    // Global error handler
    app.use((error, req, res, next) => {
      console.error('Global error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error("❌ Serverda xatolik:", error);
    process.exit(1);
  }
}

starter();
