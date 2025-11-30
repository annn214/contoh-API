import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import '#types/request'

export default class AdminMiddleware {
  async handle({ request, response, session }: HttpContext, next: NextFn) {
    // Check if this is an API route
    const isApiRoute = request.url().startsWith('/api')
    
    const user = request.user || session.get('user')

    if (!user) {
      if (isApiRoute) {
        return response.status(401).json({
          error: 'Unauthorized. Please login first.'
        })
      } else {
        session.flash('error', 'Please login first.')
        return response.redirect().toRoute('auth.login')
      }
    }

    if (user.role !== 'admin') {
      if (isApiRoute) {
        return response.status(403).json({
          error: 'Forbidden. Admin access required.'
        })
      } else {
        session.flash('error', 'Access denied. Admin privileges required.')
        return response.redirect().toRoute('employees.index')
      }
    }

    await next()
  }
}
