/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AuthController from '#controllers/auth_controller'
import EmployeeController from '#controllers/employee_controller'
import AbsensiController from '#controllers/absensi_controller'
import HolidayController from '#controllers/holiday_controller'
import { middleware } from './kernel.js'

// Home route - redirect to login
router.get('/', async ({ response, session }) => {
  const user = session.get('user')
  if (user) {
    if (user.role === 'admin') {
      return response.redirect().toRoute('dashboard.index')
    }
    return response.redirect().toRoute('absensi.index')
  }
  return response.redirect().toRoute('auth.login')
})

// ============================================
// Authentication Routes (Web)
// ============================================
router.group(() => {
  router.get('/register', [AuthController, 'showRegister']).as('auth.register')
  router.post('/register', [AuthController, 'register']).as('auth.register.store')
  router.get('/login', [AuthController, 'showLogin']).as('auth.login')
  router.post('/login', [AuthController, 'login']).as('auth.login.store')
  router.post('/logout', [AuthController, 'logout']).as('auth.logout')
})

// ============================================
// API Authentication Routes
// ============================================
router.group(() => {
  router.post('/register', [AuthController, 'apiRegister'])
  router.post('/login', [AuthController, 'apiLogin'])
  router.post('/logout', [AuthController, 'apiLogout']).use(middleware.auth())
}).prefix('/api/auth')

// ============================================
// Dashboard Route - Admin Only
// ============================================
router
  .get('/dashboard', [AbsensiController, 'dashboard'])
  .as('dashboard.index')
  .use(middleware.auth())
  .use(middleware.admin())

// ============================================
// Employee Profile Route - Protected (must be before other employee routes)
// ============================================
router
  .get('/employees/profile', [EmployeeController, 'profile'])
  .as('employees.profile')
  .use(middleware.auth())

// ============================================
// Employee Routes (Web) - Protected
// ============================================
router.group(() => {
  // List employees (admin only)
  router.get('/employees', [EmployeeController, 'index']).as('employees.index').use(middleware.admin())
  
  // CRUD operations (admin only) - Specific routes FIRST
  router.get('/employees/create', [EmployeeController, 'create']).as('employees.create').use(middleware.admin())
  router.post('/employees', [EmployeeController, 'store']).as('employees.store').use(middleware.admin())
  
  // Dynamic routes AFTER specific routes
  router.get('/employees/:id', [EmployeeController, 'show']).as('employees.show').use(middleware.admin())
  router.get('/employees/:id/edit', [EmployeeController, 'edit']).as('employees.edit').use(middleware.admin())
  router.put('/employees/:id', [EmployeeController, 'update']).as('employees.update').use(middleware.admin())
  router.delete('/employees/:id', [EmployeeController, 'destroy']).as('employees.destroy').use(middleware.admin())
}).use(middleware.auth())

// ============================================
// API Employee Routes - Protected
// ============================================
router.group(() => {
  // List and view (accessible by all authenticated users)
  router.get('/employees', [EmployeeController, 'apiIndex'])
  router.get('/employees/:id', [EmployeeController, 'apiShow'])
  
  // CRUD operations (admin only)
  router.post('/employees', [EmployeeController, 'apiStore']).use(middleware.admin())
  router.put('/employees/:id', [EmployeeController, 'apiUpdate']).use(middleware.admin())
  router.delete('/employees/:id', [EmployeeController, 'apiDestroy']).use(middleware.admin())
}).prefix('/api').use(middleware.auth())

// ============================================
// Absensi Routes (Web) - Protected
// ============================================
router.group(() => {
  // Employee only routes (admin cannot access)
  router.get('/absensi', [AbsensiController, 'index']).as('absensi.index').use(middleware.employee())
  router.post('/absensi/check-in', [AbsensiController, 'checkIn']).as('absensi.checkIn').use(middleware.employee())
  router.post('/absensi/check-out', [AbsensiController, 'checkOut']).as('absensi.checkOut').use(middleware.employee())
  
  // History route (accessible by all authenticated users, admin can view all)
  router.get('/absensi/history', [AbsensiController, 'history']).as('absensi.history')
}).use(middleware.auth())

// ============================================
// API Absensi Routes - Protected
// ============================================
router.group(() => {
  router.get('/attendance', [AbsensiController, 'apiIndex'])
  router.get('/attendance/:id', [AbsensiController, 'apiShow'])
  router.post('/attendance/check-in', [AbsensiController, 'apiCheckIn'])
  router.post('/attendance/check-out', [AbsensiController, 'apiCheckOut'])
}).prefix('/api').use(middleware.auth())

// ============================================
// Holiday Routes (Web) - Employee can view
// ============================================
router
  .get('/holidays/view', [HolidayController, 'employeeIndex'])
  .as('holidays.employee')
  .use(middleware.auth())

// ============================================
// Holiday Routes (Web) - Admin Only
// ============================================
router.group(() => {
  router.get('/holidays', [HolidayController, 'index']).as('holidays.index')
  router.get('/holidays/create', [HolidayController, 'create']).as('holidays.create')
  router.post('/holidays', [HolidayController, 'store']).as('holidays.store')
  router.post('/holidays/import', [HolidayController, 'importFromApi']).as('holidays.import')
  router.post('/holidays/:id/delete', [HolidayController, 'destroy']).as('holidays.destroy')
  router.get('/holidays/:id/edit', [HolidayController, 'edit']).as('holidays.edit')
  router.put('/holidays/:id', [HolidayController, 'update']).as('holidays.update')
  router.delete('/holidays/:id', [HolidayController, 'destroy']).as('holidays.destroy.api')
  router.get('/holidays/:id', [HolidayController, 'show']).as('holidays.show')
}).use(middleware.auth()).use(middleware.admin())
