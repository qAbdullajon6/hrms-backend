const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HRMS API',
      version: '1.0.0',
      description: 'Human Resource Management System API',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://your-render-app.onrender.com',
        description: 'Production server',
      },
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