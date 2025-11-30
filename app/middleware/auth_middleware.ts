import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import User from '#models/user'
import '#types/request'

export default class AuthMiddleware {
  async handle({ request, response, session }: HttpContext, next: NextFn) {
    // Check if this is an API route
    const isApiRoute = request.url().startsWith('/api')

    if (isApiRoute) {
      // API authentication using JWT token
      return this.handleApiAuth({ request, response }, next)
    } else {
      // Web authentication using session
      return this.handleWebAuth({ request, response, session }, next)
    }
  }

  // Handle web authentication (session-based)
  private async handleWebAuth(
    { request, response, session }: { request: HttpContext['request']; response: HttpContext['response']; session: HttpContext['session'] },
    next: NextFn
  ) {
    try {
      // Get user from session
      const sessionUser = session.get('user')

      if (!sessionUser || !sessionUser.id) {
        session.flash('error', 'Please login to continue')
        return response.redirect().toRoute('auth.login')
      }

      // Get full user data from database
      const user = await User.findById(sessionUser.id)

      if (!user) {
        session.forget('user')
        session.flash('error', 'User not found. Please login again.')
        return response.redirect().toRoute('auth.login')
      }

      // Attach user to request
      request.user = user

      await next()
    } catch (error) {
      session.flash('error', 'Authentication error. Please login again.')
      return response.redirect().toRoute('auth.login')
    }
  }

  // Handle API authentication (JWT token-based)
  private async handleApiAuth(
    { request, response }: { request: HttpContext['request']; response: HttpContext['response'] },
    next: NextFn
  ) {
    try {
      // Get token from header
      const authHeader = request.header('Authorization')
      const token = authHeader?.replace('Bearer ', '') || request.cookie('token')

      if (!token) {
        return response.status(401).json({
          error: 'Access denied. No token provided.'
        })
      }

      // Verify token
      const jwtSecret = env.get('JWT_SECRET')
      const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; role: string }

      // Get user from database
      const user = await User.findById(decoded.userId)
      
      if (!user) {
        return response.status(401).json({
          error: 'Invalid token. User not found.'
        })
      }

      // Attach user to request
      request.user = user

      await next()
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return response.status(401).json({
          error: 'Invalid token.'
        })
      }
      
      if (error.name === 'TokenExpiredError') {
        return response.status(401).json({
          error: 'Token expired.'
        })
      }

      return response.status(500).json({
        error: 'Authentication error.'
      })
    }
  }
}
