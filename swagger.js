const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger "Try it out" requests go to this URL. Render sets RENDER_EXTERNAL_URL.
const port = process.env.PORT || 5000;
const baseUrl =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.API_BASE_URL ||
  process.env.BACKEND_URL ||
  `http://localhost:${port}`;
const serverUrl = baseUrl.replace(/\/$/, ''); // no trailing slash

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HRMS API',
      version: '1.0.0',
      description: 'Human Resource Management System API',
    },
    servers: [
      { url: serverUrl, description: 'Current server' },
      { url: 'http://localhost:5000', description: 'Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Only scan ACTIVE API route files to avoid old/unused docs
  apis: [
    './routes/auth.routes.js',
    './routes/employees.routes.js',
    './routes/lookups.routes.js',
    './routes/dashboard.routes.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };