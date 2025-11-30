import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Employee middleware
 * Ensures only users with 'user' role (employees) can access the route
 * Admin role is blocked from attendance features
 */
export default class EmployeeMiddleware {
  async handle({ session, response }: HttpContext, next: NextFn) {
    const user = session.get('user')

    // Check if user is logged in
    if (!user) {
      session.flash('error', 'Unauthorized')
      return response.redirect().toRoute('auth.login')
    }

    // Block admin from accessing employee-only features
    if (user.role === 'admin') {
      session.flash('error', 'Admin tidak dapat mengakses fitur ini. Fitur absensi hanya untuk karyawan.')
      return response.redirect().toRoute('employees.index')
    }

    // Allow if user role is 'user' (employee)
    return next()
  }
}
