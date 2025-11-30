# API Documentation

Base URL: `http://localhost:3333/api`

## Authentication

All authenticated endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Auth Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201 Created):**

```json
{
  "message": "Registration successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (409 Conflict):**

```json
{
  "error": "Email already registered"
}
```

---

### Login

Authenticate and receive an access token.

**Endpoint:** `POST /auth/login`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "error": "Invalid email or password"
}
```

---

### Logout

Logout the current user (client should delete the token).

**Endpoint:** `POST /auth/logout`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Employee Endpoints

### List All Employees

Get a paginated list of all employees.

**Endpoint:** `GET /employees`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page

**Example:** `GET /employees?page=1&limit=10`

**Response (200 OK):**

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Smith",
      "position": "Software Engineer",
      "department": "Engineering",
      "salary": 75000,
      "join_date": "2024-01-15T00:00:00.000Z",
      "created_by": {
        "_id": "507f191e810c19729de860ea",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "created_at": "2024-10-15T10:30:00.000Z",
      "updated_at": "2024-10-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Authentication Required:** Yes
**Role Required:** All authenticated users

---

### Get Employee Details

Get details of a specific employee.

**Endpoint:** `GET /employees/:id`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Path Parameters:**

- `id` - Employee ID (MongoDB ObjectId)

**Example:** `GET /employees/507f1f77bcf86cd799439011`

**Response (200 OK):**

```json
{
  "data": {
    "\_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "position": "Software Engineer",
    "department": "Engineering",
    "salary": 75000,
    "join_date": "2024-01-15T00:00:00.000Z",
    "created_by": {
      "\_id": "507f191e810c19729de860ea",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "created_at": "2024-10-15T10:30:00.000Z",
    "updated_at": "2024-10-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Employee not found"
}
```

**Authentication Required:** Yes
**Role Required:** All authenticated users

---

### Create Employee

Create a new employee record.

**Endpoint:** `POST /employees`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Jane Smith",
  "position": "Software Engineer",
  "department": "Engineering",
  "salary": 75000,
  "join_date": "2024-01-15"
}
```

**Field Validations:**

- `name`: Required, string, 3-100 characters
- `position`: Required, string, 2-100 characters
- `department`: Required, string, 2-100 characters
- `salary`: Required, number, min 0, max 999999999
- `join_date`: Optional, date (defaults to current date)

**Response (201 Created):**

```json
{
  "message": "Employee created successfully",
  "data": {
    "\_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "position": "Software Engineer",
    "department": "Engineering",
    "salary": 75000,
    "join_date": "2024-01-15T00:00:00.000Z",
    "created_by": "507f191e810c19729de860ea",
    "created_at": "2024-10-15T10:30:00.000Z",
    "updated_at": "2024-10-15T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": [
    {
      "field": "name",
      "message": "The name field must be at least 3 characters",
      "rule": "minLength"
    }
  ]
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "Forbidden. Admin access required."
}
```

**Authentication Required:** Yes
**Role Required:** Admin only

---

### Update Employee

Update an existing employee's information.

**Endpoint:** `PUT /employees/:id`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Path Parameters:**

- `id` - Employee ID (MongoDB ObjectId)

**Request Body (all fields optional):**

```json
{
  "name": "Jane Smith",
  "position": "Senior Software Engineer",
  "department": "Engineering",
  "salary": 85000,
  "join_date": "2024-01-15"
}
```

**Response (200 OK):**

```json
{
  "message": "Employee updated successfully",
  "data": {
    "\_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "position": "Senior Software Engineer",
    "department": "Engineering",
    "salary": 85000,
    "join_date": "2024-01-15T00:00:00.000Z",
    "created_by": "507f191e810c19729de860ea",
    "created_at": "2024-10-15T10:30:00.000Z",
    "updated_at": "2024-10-17T14:25:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Employee not found"
}
```

**Authentication Required:** Yes
**Role Required:** Admin only

---

### Delete Employee

Delete an employee record.

**Endpoint:** `DELETE /employees/:id`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Path Parameters:**

- `id` - Employee ID (MongoDB ObjectId)

**Response (200 OK):**

```json
{
  "message": "Employee deleted successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Employee not found"
}
```

**Authentication Required:** Yes
**Role Required:** Admin only

---

## Error Responses

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data/validation error
- **401 Unauthorized** - Authentication required or token invalid
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists
- **500 Internal Server Error** - Server error

### Authentication Errors

**401 Unauthorized - No Token:**

```json
{
  "error": "Access denied. No token provided."
}
```

**401 Unauthorized - Invalid Token:**

```json
{
  "error": "Invalid token."
}
```

**401 Unauthorized - Expired Token:**

```json
{
  "error": "Token expired."
}
```

### Authorization Errors

**403 Forbidden:**

```json
{
  "error": "Forbidden. Admin access required."
}
```

---

## Example Usage

### cURL Examples

**Register:**

```bash
curl -X POST http://localhost:3333/api/auth/register \\
-H "Content-Type: application/json" \\
-d '{
"name": "John Doe",
"email": "john@example.com",
"password": "password123",
"role": "admin"
}'
```

**Login:**

```bash
curl -X POST http://localhost:3333/api/auth/login \\
-H "Content-Type: application/json" \\
-d '{
"email": "john@example.com",
"password": "password123"
}'
```

**Get Employees:**

```bash
curl -X GET "http://localhost:3333/api/employees?page=1&limit=10" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Create Employee:**

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

**Update Employee:**

```bash
curl -X PUT http://localhost:3333/api/employees/507f1f77bcf86cd799439011 \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-d '{
"salary": 85000,
"position": "Senior Software Engineer"
}'
```

**Delete Employee:**

```bash
curl -X DELETE http://localhost:3333/api/employees/507f1f77bcf86cd799439011 \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Attendance Endpoints

### List Attendance

Get attendance records with optional filters.

**Endpoint:** `GET /attendance`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `employee_id` (optional): Filter by employee ID (admin only)
- `start_date` (optional): Filter from date (ISO 8601)
- `end_date` (optional): Filter to date (ISO 8601)
- `status` (optional): Filter by status (present, late, absent, half-day)

**Response (200 OK):**

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "employee_id": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "position": "Software Engineer",
        "department": "Engineering"
      },
      "date": "2025-11-18T00:00:00.000Z",
      "check_in": "2025-11-18T08:45:00.000Z",
      "check_out": "2025-11-18T17:30:00.000Z",
      "status": "present",
      "late_duration": 0,
      "work_duration": 525,
      "notes": "",
      "created_at": "2025-11-18T08:45:00.000Z",
      "updated_at": "2025-11-18T17:30:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Get Single Attendance

Get details of a specific attendance record.

**Endpoint:** `GET /attendance/:id`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**

```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "employee_id": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "position": "Software Engineer",
      "department": "Engineering"
    },
    "date": "2025-11-18T00:00:00.000Z",
    "check_in": "2025-11-18T08:45:00.000Z",
    "check_out": "2025-11-18T17:30:00.000Z",
    "status": "present",
    "late_duration": 0,
    "work_duration": 525,
    "notes": "",
    "created_at": "2025-11-18T08:45:00.000Z",
    "updated_at": "2025-11-18T17:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Attendance not found"
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "Forbidden"
}
```

_Note: Users can only view their own attendance records. Admins can view all._

---

### Check-in

Record employee check-in for the current day. Uses WorldTimeAPI to get accurate time in Asia/Makassar (WITA) timezone.

**Endpoint:** `POST /attendance/check-in`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "notes": "Optional check-in notes"
}
```

**Response (201 Created):**

```json
{
  "message": "Check-in successful",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "employee_id": "507f1f77bcf86cd799439012",
    "date": "2025-11-18T00:00:00.000Z",
    "check_in": "2025-11-18T09:15:00.000Z",
    "status": "late",
    "late_duration": 15,
    "work_duration": 0,
    "notes": "Optional check-in notes",
    "created_at": "2025-11-18T09:15:00.000Z",
    "updated_at": "2025-11-18T09:15:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Already checked in today"
}
```

```json
{
  "error": "Tidak bisa check-in pada hari libur: [Holiday Name]"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Employee record not found"
}
```

_Notes:_

- **Admin cannot perform attendance** - This endpoint is for employees only
- Standard work time is 09:00 WITA (UTC+8)
- Check-in after 09:00 WITA is marked as "late"
- Late duration is calculated in minutes
- Only one check-in allowed per day
- **Check-in is blocked on holidays** - System checks holiday database before allowing check-in
- Admin role will receive `403 Forbidden` error

---

### Check-out

Record employee check-out for the current day.

**Endpoint:** `POST /attendance/check-out`

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "notes": "Optional check-out notes"
}
```

**Response (200 OK):**

```json
{
  "message": "Check-out successful",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "employee_id": "507f1f77bcf86cd799439012",
    "date": "2025-11-18T00:00:00.000Z",
    "check_in": "2025-11-18T09:15:00.000Z",
    "check_out": "2025-11-18T17:30:00.000Z",
    "status": "late",
    "late_duration": 15,
    "work_duration": 495,
    "notes": "Optional check-in notes | Optional check-out notes",
    "created_at": "2025-11-18T09:15:00.000Z",
    "updated_at": "2025-11-18T17:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "No check-in record found today"
}
```

```json
{
  "error": "Already checked out today"
}
```

_Notes:_

- **Admin cannot perform attendance** - This endpoint is for employees only
- Must check-in before check-out
- Work duration is calculated automatically in minutes
- Multiple notes are concatenated with `|` separator
- Admin role will receive `403 Forbidden` error

---

## Attendance Status Codes

| Status   | Description                              |
| -------- | ---------------------------------------- |
| present  | Checked in on time (before 09:00 AM)     |
| late     | Checked in late (after 09:00 AM)         |
| absent   | No attendance record for the day         |
| half-day | Worked less than standard hours (future) |

---

## WorldTimeAPI Integration

The attendance system uses [WorldTimeAPI](https://worldtimeapi.org/) to fetch accurate time in **Asia/Makassar (WITA)** timezone. This ensures consistent timekeeping across different server locations.

**API Endpoint:** `https://worldtimeapi.org/api/timezone/Asia/Makassar`

**Features:**

- Automatic timezone handling (Asia/Makassar - WITA, UTC+8)
- Fallback to local time if API is unavailable
- Accurate late detection based on actual WITA time
- Consistent date/time across all attendance records
- Debug logging for timezone conversion issues

**Why Asia/Makassar (WITA)?**

- WITA = Waktu Indonesia Tengah (Central Indonesia Time)
- UTC+8 timezone
- Covers cities: Makassar, Balikpapan, Manado, Denpasar (Bali)
- More accurate for Indonesian businesses in eastern regions

---

## cURL Examples

**Check-in:**

```bash
curl -X POST http://localhost:3333/api/attendance/check-in \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-d '{
  "notes": "Check-in from mobile"
}'
```

**Check-out:**

```bash
curl -X POST http://localhost:3333/api/attendance/check-out \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-d '{
  "notes": "Check-out from office"
}'
```

**Get Attendance with Filters:**

```bash
curl -X GET "http://localhost:3333/api/attendance?start_date=2025-11-01&end_date=2025-11-30&status=late" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Single Attendance:**

```bash
curl -X GET http://localhost:3333/api/attendance/507f1f77bcf86cd799439011 \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

---

## Holiday Management

### Overview

The system includes comprehensive holiday management with integration to [HolidayAPI.com](https://holidayapi.com/) for automatic import of Indonesian national holidays.

**Holiday Types:**

- `national` - National holidays (e.g., Independence Day)
- `religious` - Religious holidays (e.g., Eid al-Fitr, Christmas)
- `company` - Company-specific holidays
- `other` - Other types of holidays

**Features:**

- Automatic blocking of check-in on holidays
- Holiday badges in attendance history
- Upcoming holidays display on dashboard
- Import from HolidayAPI.com (admin only)
- Full CRUD operations (admin only)
- Read-only access for employees

---

### Holiday Integration with Attendance

**Check-in Blocking:**
When an employee tries to check in on a holiday, the system will:

1. Detect the holiday from the database
2. Block the check-in attempt
3. Return error message with holiday name

**Attendance History:**

- Holiday badges (🎉) displayed in attendance records
- Shows holiday name and type
- Helps identify why no attendance was recorded

**Dashboard Display:**

- Shows upcoming holidays (next 5)
- Displays date, name, and type
- Quick overview for employees and admins

---

### API Endpoints (Future)

_Note: Currently, holiday management is only available through web interface. API endpoints are planned for future release._

**Planned Endpoints:**

- `GET /api/holidays` - List holidays with filters
- `GET /api/holidays/:id` - Get holiday details
- `POST /api/holidays` - Create holiday (admin only)
- `PUT /api/holidays/:id` - Update holiday (admin only)
- `DELETE /api/holidays/:id` - Delete holiday (admin only)
- `GET /api/holidays/upcoming` - Get upcoming holidays

---

### Web Interface Routes

**Admin Routes:**

- `GET /holidays` - List and manage holidays
- `GET /holidays/create` - Create new holiday
- `POST /holidays` - Store new holiday
- `POST /holidays/import` - Import from HolidayAPI.com
- `GET /holidays/:id/edit` - Edit holiday
- `PUT /holidays/:id` - Update holiday
- `DELETE /holidays/:id` - Delete holiday
- `GET /holidays/:id` - View holiday details

**Employee Routes:**

- `GET /holidays/view` - View holidays (read-only)

---

### HolidayAPI Integration

**Setup:**

1. Register at [holidayapi.com](https://holidayapi.com/)
2. Get free API key (1,000 requests/month)
3. Add to `.env`: `HOLIDAY_API_KEY=your-key-here`
4. Restart server

**Limitations:**

- Free tier only allows previous year data (2024)
- Current year data requires premium subscription
- Import is done through web interface only

**Import Process:**

1. Admin navigates to `/holidays`
2. Clicks "🌐 Import dari API (2024)" button
3. System fetches Indonesian holidays from HolidayAPI
4. Checks for duplicates
5. Saves new holidays to database
6. Shows success message with import count

---

## Employee Profile

### Get Employee Profile

Employees can view their own profile information.

**Web Route:** `GET /employees/profile`

**Response:** Displays employee information including:

- Personal details (name, position, department)
- Salary information
- Join date
- Attendance statistics
- Recent attendance records

**Access:**

- Available to all authenticated employees
- Shows only the logged-in employee's data
- Admin cannot access this route (admin uses dashboard)

---

## System Configuration

### Timezone Settings

**Primary Timezone:** Asia/Makassar (WITA, UTC+8)

- Used for all attendance calculations
- Integrated with WorldTimeAPI: `https://worldtimeapi.org/api/timezone/Asia/Makassar`
- Fallback to local server time if API unavailable

**Standard Work Hours:**

- Work start time: 09:00 WITA
- Standard work duration: 9 hours (540 minutes)
- Late threshold: Check-in after 09:00 WITA

### Session Management

**Web Authentication:**

- Session-based authentication for web routes
- User data stored in session: `{ id, name, email, role }`
- Session cookie: `adonis-session`
- CSRF protection enabled for all POST/PUT/DELETE requests

**API Authentication:**

- Bearer token authentication
- Token format: `Authorization: Bearer YOUR_TOKEN`
- Token expiry: 7 days
- Refresh token: Not implemented yet

---

## Role-Based Access Control

### Admin Role

**Permissions:**

- Full access to employee CRUD operations
- View all attendance records
- Access dashboard with statistics
- Full holiday management (CRUD + Import)
- Cannot perform check-in/check-out (attendance is for employees only)

**Admin Routes:**

- `/dashboard` - Overview statistics
- `/employees` - Manage employees
- `/employees/create` - Add new employee
- `/employees/:id` - View employee details
- `/employees/:id/edit` - Edit employee
- `/absensi/history` - View all attendance records
- `/holidays` - Manage holidays

### Employee Role

**Permissions:**

- View own profile and information
- Perform check-in/check-out
- View own attendance history
- View holidays (read-only)
- Cannot access admin dashboard
- Cannot manage other employees

**Employee Routes:**

- `/absensi` - Check-in/check-out interface
- `/absensi/history` - View own attendance history
- `/employees/profile` - View own profile
- `/holidays/view` - View holidays (read-only)

---

## Error Handling

### Validation Errors

**Employee Validation:**

```json
{
  "errors": {
    "name": ["The name field must be at least 3 characters"],
    "salary": ["The salary field must be a number"],
    "position": ["The position field is required"]
  }
}
```

**Holiday Validation:**

```json
{
  "errors": {
    "name": ["The name field is required"],
    "date": ["The date field must be a valid date"],
    "type": ["The type must be one of: national, religious, company, other"]
  }
}
```

### Business Logic Errors

**Attendance Errors:**

```json
{
  "error": "Tidak bisa check-in pada hari libur: Hari Kemerdekaan"
}
```

```json
{
  "error": "Sudah check-in hari ini"
}
```

```json
{
  "error": "Belum check-in hari ini"
}
```

**Authorization Errors:**

```json
{
  "error": "Admin tidak bisa melakukan absensi"
}
```

```json
{
  "error": "Akses ditolak. Hanya admin yang dapat mengakses."
}
```

---

## Database Schema

### User Model

```typescript
{
  _id: ObjectId
  name: string (required, 3-100 chars)
  email: string (required, unique, valid email)
  password: string (required, hashed)
  role: string (enum: 'admin' | 'user', default: 'user')
  created_at: Date
  updated_at: Date
}
```

### Employee Model

```typescript
{
  _id: ObjectId
  name: string (required, 3-100 chars)
  position: string (required, 2-100 chars)
  department: string (required, 2-100 chars)
  salary: number (required, min: 0, max: 999999999)
  join_date: Date (default: now)
  created_by: ObjectId (ref: 'User')
  created_at: Date
  updated_at: Date
}
```

**Indexes:**

- `name: 1` (ascending)
- `department: 1` (ascending)

### Attendance Model

```typescript
{
  _id: ObjectId
  employee_id: ObjectId (ref: 'Employee', required)
  date: Date (required)
  check_in: Date
  check_out: Date
  status: string (enum: 'present' | 'late' | 'absent' | 'half-day')
  late_duration: number (minutes, default: 0)
  work_duration: number (minutes, default: 0)
  notes: string (optional)
  created_at: Date
  updated_at: Date
}
```

**Indexes:**

- `{ employee_id: 1, date: 1 }` (unique compound index)
- `date: 1` (ascending)
- `status: 1` (ascending)

### Holiday Model

```typescript
{
  _id: ObjectId
  name: string (required, 3-200 chars)
  date: Date (required)
  type: string (enum: 'national' | 'religious' | 'company' | 'other', required)
  is_recurring: boolean (default: false)
  description: string (optional, max 500 chars)
  created_by: ObjectId (ref: 'User')
  created_at: Date
  updated_at: Date
}
```

**Indexes:**

- `{ date: 1, type: 1 }` (compound index)
- `{ date: 1, name: 1 }` (unique compound index)

---

## Environment Variables

Required environment variables for the application:

```env
# Application
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=your-app-key-here
APP_URL=http://localhost:3333

# Database
MONGO_URI=mongodb://localhost:27017/karyawan

# Session
SESSION_DRIVER=cookie

# HolidayAPI (Optional)
HOLIDAY_API_KEY=your-holidayapi-key-here
```

---

## Testing the API

### Postman Collection

Import these examples into Postman:

**1. Register Admin:**

```bash
POST http://localhost:3333/api/auth/register
Body (JSON):
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

**2. Register Employee:**

```bash
POST http://localhost:3333/api/auth/register
Body (JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**3. Login:**

```bash
POST http://localhost:3333/api/auth/login
Body (JSON):
{
  "email": "john@example.com",
  "password": "password123"
}
```

**4. Create Employee (Admin):**

```bash
POST http://localhost:3333/api/employees
Headers:
- Authorization: Bearer YOUR_ACCESS_TOKEN
- Content-Type: application/json
Body (JSON):
{
  "name": "Jane Smith",
  "position": "Software Engineer",
  "department": "Engineering",
  "salary": 75000,
  "join_date": "2024-01-15"
}
```

**5. Check-in (Employee):**

```bash
POST http://localhost:3333/api/attendance/check-in
Headers:
- Authorization: Bearer YOUR_ACCESS_TOKEN
- Content-Type: application/json
Body (JSON):
{
  "notes": "Morning check-in"
}
```

**6. Check-out (Employee):**

```bash
POST http://localhost:3333/api/attendance/check-out
Headers:
- Authorization: Bearer YOUR_ACCESS_TOKEN
- Content-Type: application/json
Body (JSON):
{
  "notes": "End of work day"
}
```

**7. Get Attendance History:**

```bash
GET http://localhost:3333/api/attendance?page=1&limit=10
Headers:
- Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Notes

- All dates are in ISO 8601 format
- Tokens expire after 7 days
- Maximum pagination limit is 100 items per page
- All monetary values (salary) are in Indonesian Rupiah (IDR)
- ObjectIds must be valid MongoDB ObjectIds (24 character hex string)
- Attendance times use Asia/Makassar timezone (WITA, UTC+8)
- Work duration is calculated in minutes
- Standard work time starts at 09:00 WITA
- Holiday check-in blocking is automatic
- CSRF tokens required for all web form submissions
- Session cookies are HTTP-only and secure in production
- Free tier HolidayAPI only supports previous year data (2024)
