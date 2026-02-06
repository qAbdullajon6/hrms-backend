# HRMS Backend API

Human Resource Management System backend built with Node.js, Express, PostgreSQL, and Sequelize.

## Features

- User Authentication & Authorization (JWT)
- Employee Management (CRUD operations)
- File Upload (Images & Documents)
- Password Reset via Email
- Swagger API Documentation
- PostgreSQL Database
- CORS Support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Documentation**: Swagger UI

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` file with actual values

3. Create `.env` file and configure environment variables:
   ```env
   # Database Configuration
   DB_NAME=hrms_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432

   # Server Configuration
   PORT=5000
   CLIENT_URL=http://localhost:3000

   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   RESET_TOKEN_SECRET=your_reset_token_secret

   # SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. Initialize complete database (auto-creates DB, runs migrations & seeds):
   ```bash
   npm run db:init
   ```

   Or run individually:
   ```bash
   npm run create-db    # Create database
   npm run migrate      # Run migrations
   npm run seed         # Run seeders
   ```

   Reset database (⚠️ WARNING: Deletes all data):
   ```bash
   npm run db:reset
   ```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

**Note**: Production da server avtomatik ravishda:
- Database mavjudligini tekshiradi va yaratadi
- Barcha tablelarni yaratadi/sync qiladi
- Default admin user ni yaratadi

### Database Management

```bash
# To'liq database initialization (recommended for new deployments)
npm run db:init

# Individual commands
npm run create-db     # Create database only
npm run migrate       # Run migrations only
npm run seed         # Run seeders only

# Database reset (WARNING: Deletes all data!)
npm run db:reset

# Migration management
npm run migrate       # Run all pending migrations
npm run migrate:undo  # Undo last migration
npm run db:drop       # Drop all tables
```

## API Documentation

Once the server is running, visit:
- **API Docs**: `http://localhost:5000/api`
- **API Base URL**: `http://localhost:5000/api`

## Default Admin User

Seeder orqali quyidagi admin user yaratiladi:
- **Email**: `admin@hrms.com`
- **Password**: `admin123`

Bu userdan production da foydalanib, yangi userlar yarating va keyin uni o'chiring.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/create` - User registration
- `GET /api/auth/user/me` - Get current user
- `GET /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Verify reset code
- `POST /api/auth/change-password` - Change password

### Employee Management
- `POST /api/employee/create` - Create employee
- `GET /api/employee/get/all` - Get all employees
- `PUT /api/employee/update/:id` - Update employee
- `DELETE /api/employee/delete/:id` - Delete employee

## File Upload

The API supports file uploads for:
- Avatar images (JPEG, JPG, PNG)
- Documents (PDF, DOC, DOCX)

Files are stored in `public/files/` directory.

## Deployment to Render.com

### Database Setup
1. **Create PostgreSQL Database** on Render:
   - Go to Render Dashboard → New → PostgreSQL
   - Choose a name (e.g., `hrms-db`)
   - Copy the connection details

2. **Note the connection details**:
   - Host, Port, Database name, Username, Password
   - External Database URL (if available)

### Backend Deployment
1. **Create a Render account** and connect your GitHub repository

2. **Create a new Web Service**:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm run db:init && npm start`

3. **Configure Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   CLIENT_URL=https://your-frontend-domain.onrender.com

   # Database (from your PostgreSQL instance)
   DB_HOST=your-db-host
   DB_PORT=5432
   DB_NAME=your-db-name
   DB_USER=your-db-username
   DB_PASSWORD=your-db-password

   # Or use external URL if available
   POSTGRES_URL=postgresql://user:pass@host:port/dbname

   # JWT Secrets (generate random strings)
   JWT_SECRET=your_random_jwt_secret
   ACCESS_TOKEN_SECRET=your_random_access_secret
   REFRESH_TOKEN_SECRET=your_random_refresh_secret
   RESET_TOKEN_SECRET=your_random_reset_secret

   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

### Auto-Database Setup
The `npm run db:init` command automatically:
- ✅ Creates the database if it doesn't exist
- ✅ Runs all migrations to create tables
- ✅ Seeds initial data (admin user: `admin@hrms.com` / `admin123`)

### Troubleshooting
**Agar render.com da database xatosi yuzaga kelsa**:
1. Environment variables ni tekshiring
2. Database service running ekanligini tekshiring
3. Logs larni tekshiring - server avtomatik ravishda muammolarni hal qiladi
4. SSL muammolari bo'lsa, render.com PostgreSQL SSL ni qo'llab-quvvatlaydi

**First deployment da uzoq davom etishi mumkin** - database yaratish va migration lar tufayli.

**Muvaffaqiyatli deployment belgisi**:
```
✅ Database initialization tugadi
✅ Server is running on port 10000
```

3. **Configure Environment Variables** in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   CLIENT_URL=https://your-frontend-domain.com
   DB_NAME=your_postgres_db_name
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_HOST=your_postgres_host
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   RESET_TOKEN_SECRET=your_reset_token_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Database Setup**:
   - Create a PostgreSQL database on Render or use an external PostgreSQL service
   - Update the environment variables with your database credentials

5. **Deploy** your application

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_NAME` | PostgreSQL database name | `hrms_db` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `password` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `PORT` | Server port | `5000` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT secret key | Required |
| `ACCESS_TOKEN_SECRET` | Access token secret | Required |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | Required |
| `RESET_TOKEN_SECRET` | Reset token secret | Required |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | Required for email |
| `SMTP_PASS` | SMTP password/app password | Required for email |

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database configuration
├── controllers/
│   ├── auth.controller.js     # Authentication logic
│   └── employee.controller.js # Employee management logic
├── middlewares/
│   ├── auth.middleware.js     # JWT authentication
│   ├── validate.middleware.js # Input validation
│   └── employee.middleware.js # Employee data parsing
├── models/
│   ├── employee/          # Employee related models
│   ├── user/              # User model
│   ├── tokens/            # Token models
│   ├── code/              # Reset code model
│   ├── relations.js       # Model relationships
│   └── ...
├── routes/
│   ├── auth.routes.js     # Auth endpoints
│   └── employee.routes.js # Employee endpoints
├── utils/
│   ├── jwt.js             # JWT utilities
│   ├── hash.js            # Password hashing
│   ├── token.js           # Token management
│   └── sendEmail.js       # Email utilities
├── public/files/          # Uploaded files
├── swagger.js             # Swagger configuration
├── server.js              # Main server file
├── create-db.js           # Database creation script
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.