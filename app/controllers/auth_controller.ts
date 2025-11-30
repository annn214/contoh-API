import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import { registerValidator, loginValidator } from '#validators/auth_validator'
import '#types/request'

export default class AuthController {
  // Show register page
  async showRegister({ view }: HttpContext) {
    return view.render('pages/auth/register')
  }

  // Show login page
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  // Register new user
  async register({ request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)

      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email })
      if (existingUser) {
        session.flash('error', 'Email already registered')
        return response.redirect().back()
      }

      // Create new admin user (registration is only for admins)
      const user = new User({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'admin' // Force admin role for registration
      })

      await user.save()

      session.flash('success', 'Admin registration successful! Please login.')
      return response.redirect().toRoute('auth.login')
    } catch (error: any) {
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', 'Registration failed. Please try again.')
      }
      return response.redirect().back()
    }
  }

  // Login user
  async login({ request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator)

      // Find user
      const user = await User.findOne({ email: data.email })
      if (!user) {
        session.flash('error', 'Invalid email or password')
        return response.redirect().back()
      }

      // Check password
      const isPasswordValid = await user.comparePassword(data.password)
      if (!isPasswordValid) {
        session.flash('error', 'Invalid email or password')
        return response.redirect().back()
      }

      // Generate JWT token
      const jwtSecret = env.get('JWT_SECRET')
      const token = jwt.sign(
        { userId: String(user._id), email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      )

      // Set token in cookie
      response.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      })

      // Store user info in session
      session.put('user', {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role
      })

      session.flash('success', `Welcome back, ${user.name}!`)
      
      // Redirect based on role
      if (user.role === 'admin') {
        return response.redirect().toRoute('dashboard.index')
      } else {
        return response.redirect().toRoute('absensi.index')
      }
    } catch (error: any) {
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', 'Login failed. Please try again.')
      }
      return response.redirect().back()
    }
  }

  // API Login (returns JSON with token)
  async apiLogin({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator)

      // Find user
      const user = await User.findOne({ email: data.email })
      if (!user) {
        return response.status(401).json({
          error: 'Invalid email or password'
        })
      }

      // Check password
      const isPasswordValid = await user.comparePassword(data.password)
      if (!isPasswordValid) {
        return response.status(401).json({
          error: 'Invalid email or password'
        })
      }

      // Generate JWT token
      const jwtSecret = env.get('JWT_SECRET')
      const token = jwt.sign(
        { userId: String(user._id), email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      )

      return response.json({
        message: 'Login successful',
        access_token: token,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } catch (error: any) {
      return response.status(400).json({
        error: error.messages || 'Login failed'
      })
    }
  }

  // API Register
  async apiRegister({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)

      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email })
      if (existingUser) {
        return response.status(409).json({
          error: 'Email already registered'
        })
      }

      // Create new user
      const user = new User({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'user'
      })

      await user.save()

      // Generate JWT token
      const jwtSecret = env.get('JWT_SECRET')
      const token = jwt.sign(
        { userId: String(user._id), email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      )

      return response.status(201).json({
        message: 'Registration successful',
        access_token: token,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } catch (error: any) {
      return response.status(400).json({
        error: error.messages || 'Registration failed'
      })
    }
  }

  // Logout
  async logout({ response, session }: HttpContext) {
    // Clear cookie
    response.clearCookie('token')
    
    // Clear session
    session.forget('user')
    
    session.flash('success', 'Logged out successfully')
    return response.redirect().toRoute('auth.login')
  }

  // API Logout
  async apiLogout({ response }: HttpContext) {
    // In a real-world scenario, you might want to blacklist the token
    // For now, we'll just return success and let the client delete the token
    return response.json({
      message: 'Logged out successfully'
    })
  }
}
