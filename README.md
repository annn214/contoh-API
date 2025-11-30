# Employee Management System

A fullstack Employee Management System built with AdonisJS 6 and MongoDB.

## Features

- ✅ JWT-based authentication (access tokens)
- ✅ Role-based access control (Admin & User)
- ✅ Complete CRUD operations for employees
- ✅ Modern UI with TailwindCSS
- ✅ MongoDB database with Mongoose
- ✅ Input validation with VineJS
- ✅ Pagination support
- ✅ Secure password hashing with bcrypt

## Tech Stack

- **Backend**: AdonisJS 6 (Node.js framework)
- **Database**: MongoDB
- **ORM**: Mongoose
- **Frontend**: Edge Template Engine
- **Styling**: TailwindCSS 4
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: VineJS

## Prerequisites

- Node.js (v20 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   cd karyawan
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env

   # Application

   TZ=UTC
   PORT=3333
   HOST=localhost
   LOG_LEVEL=info
   APP_KEY=generate-a-secure-key-here
   NODE_ENV=development

   # MongoDB Database

   MONGODB_URI=mongodb://localhost:27017/karyawan

   # Or use MongoDB Atlas:

   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karyawan

   # JWT Secret (use a long random string)

   JWT_SECRET=your-super-secret-jwt-key-change-this

   # Session

   SESSION_DRIVER=cookie

   ```

4. **Generate APP_KEY**

   ```bash
   node ace generate:key
   ```

5. **Start MongoDB** (if using local MongoDB)

   ```bash

   # On Linux/Mac

   sudo systemctl start mongodb

   # or

   mongod

   # On Windows (if installed as service)

   net start MongoDB
   ```

6. **Run the application**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3333`

## Database Models

### User Model

```javascript
{
"\_id": "ObjectId",
"name": "string",
"email": "string (unique)",
"password": "string (hashed)",
"role": "string (admin or user)",
"created_at": "Date"
}
```

### Employee Model

```javascript
{
"\_id": "ObjectId",
"name": "string",
"position": "string",
"department": "string",
"salary": "number",
"join_date": "Date",
"created_by": "ObjectId (User reference)"
}
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description         | Auth Required |
| ------ | -------------------- | ------------------- | ------------- |
| POST   | `/api/auth/register` | Register new user   | No            |
| POST   | `/api/auth/login`    | Login and get token | No            |
| POST   | `/api/auth/logout`   | Logout user         | Yes           |

### Employees

| Method | Endpoint             | Description          | Auth Required | Role  |
| ------ | -------------------- | -------------------- | ------------- | ----- |
| GET    | `/api/employees`     | List all employees   | Yes           | All   |
| GET    | `/api/employees/:id` | Get employee details | Yes           | All   |
| POST   | `/api/employees`     | Create new employee  | Yes           | Admin |
| PUT    | `/api/employees/:id` | Update employee      | Yes           | Admin |
| DELETE | `/api/employees/:id` | Delete employee      | Yes           | Admin |

## Web Routes

| Method | Endpoint              | Description                  |
| ------ | --------------------- | ---------------------------- |
| GET    | `/register`           | Registration page            |
| POST   | `/register`           | Process registration         |
| GET    | `/login`              | Login page                   |
| POST   | `/login`              | Process login                |
| POST   | `/logout`             | Logout                       |
| GET    | `/employees`          | List employees               |
| GET    | `/employees/:id`      | View employee                |
| GET    | `/employees/create`   | Create form (Admin only)     |
| POST   | `/employees`          | Store employee (Admin only)  |
| GET    | `/employees/:id/edit` | Edit form (Admin only)       |
| PUT    | `/employees/:id`      | Update employee (Admin only) |
| DELETE | `/employees/:id`      | Delete employee (Admin only) |

## Usage

### 1. Register a User

Visit `http://localhost:3333/register` and create an account.

**First user should be an Admin:**

- Name: Admin User
- Email: admin@example.com
- Password: admin123
- Role: admin

### 2. Login

Visit `http://localhost:3333/login` and login with your credentials.

### 3. Manage Employees

**Admin users can:**

- View all employees
- Add new employees
- Edit employee details
- Delete employees

**Regular users can:**

- View all employees
- View employee details

## API Usage Examples

### Register User (API)

```bash
curl -X POST http://localhost:3333/api/auth/register \\
-H "Content-Type: application/json" \\
-d '{
"name": "John Doe",
"email": "john@example.com",
"password": "password123",
"role": "user"
}'
```

### Login (API)

```bash
curl -X POST http://localhost:3333/api/auth/login \\
-H "Content-Type: application/json" \\
-d '{
"email": "admin@example.com",
"password": "admin123"
}'
```

### Create Employee (API)

```bash
curl -X POST http://localhost:3333/api/employees \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-d '{
"name": "Jane Smith",
"position": "Software Engineer",
"department": "Engineering",
"salary": 75000,
"join_date": "2024-01-15"
}'
```

### Get All Employees (API)

```bash
curl -X GET "http://localhost:3333/api/employees?page=1&limit=10" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
karyawan/
├── app/
│ ├── controllers/
│ │ ├── auth_controller.js # Authentication logic
│ │ └── employee_controller.js # Employee CRUD operations
│ ├── middleware/
│ │ ├── auth_middleware.js # JWT verification
│ │ └── admin_middleware.js # Admin role check
│ ├── models/
│ │ ├── user.js # User model (Mongoose)
│ │ └── employee.js # Employee model (Mongoose)
│ └── validators/
│ ├── auth_validator.js # Auth validation rules
│ └── employee_validator.js # Employee validation rules
├── config/
│ ├── database.js # MongoDB connection config
│ └── ...
├── resources/
│ ├── css/
│ │ └── app.css # TailwindCSS styles
│ └── views/
│ ├── layouts/
│ │ └── main.edge # Main layout
│ └── pages/
│ ├── auth/
│ │ ├── login.edge # Login page
│ │ └── register.edge # Register page
│ └── employees/
│ ├── index.edge # Employee list
│ ├── show.edge # Employee details
│ └── form.edge # Create/Edit form
├── start/
│ ├── routes.ts # Route definitions
│ ├── kernel.ts # Middleware registration
│ └── env.ts # Environment validation
└── ...
```

## Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT tokens with 7-day expiration
- ✅ HTTP-only cookies for web authentication
- ✅ Role-based access control
- ✅ Input validation with VineJS
- ✅ CSRF protection (via AdonisJS Shield)
- ✅ XSS protection

## Development Commands

```bash

# Start development server with hot reload

npm run dev

# Build for production

npm run build

# Start production server

npm start

# Run tests

npm test

# Lint code

npm run lint

# Format code

npm run format

# Type checking

npm run typecheck
```

## Troubleshooting

### MongoDB Connection Error

**Problem**: Cannot connect to MongoDB

**Solution**:

- Check if MongoDB is running: \`systemctl status mongodb\`
- Verify connection string in \`.env\`
- Check MongoDB logs: \`tail -f /var/log/mongodb/mongod.log\`

### JWT Token Invalid

**Problem**: "Invalid token" error

**Solution**:

- Check if JWT_SECRET is set in \`.env\`
- Verify token is being sent in Authorization header
- Token might be expired (tokens expire after 7 days)

### Port Already in Use

**Problem**: Port 3333 is already in use

**Solution**:

- Change PORT in \`.env\` file
- Kill process using port: \`lsof -ti:3333 | xargs kill -9\`

## License

UNLICENSED - Private project

## Support

For issues and questions, please create an issue in the repository.
