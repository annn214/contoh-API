import type { HttpContext } from '@adonisjs/core/http'
import Employee from '#models/employee'
import User from '#models/user'
import { createEmployeeValidator, updateEmployeeValidator } from '#validators/employee_validator'
import { generateEmailFromName, generatePassword } from '../helpers/employee_account_helper.js'
import '#types/request'
import mongoose from 'mongoose'

export default class EmployeeController {
  // List all employees with pagination
  async index({ request, view, session, logger }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = 10
      const skip = (page - 1) * limit

      // Get search parameters
      const searchQuery = request.input('search', '')
      const searchField = request.input('field', 'all')

      // Build search filter
      const filter: any = {}
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i') // case-insensitive search
        
        if (searchField === 'all') {
          // Search across all fields
          filter.$or = [
            { name: regex },
            { position: regex },
            { department: regex }
          ]
        } else {
          // Search specific field
          filter[searchField] = regex
        }
      }

      const total = await Employee.countDocuments(filter)
      const employees = await Employee.find(filter)
        .populate('created_by', 'name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)

      const totalPages = Math.ceil(total / limit)

      const user = session.get('user')

      return view.render('pages/employees/index', {
        employees,
        currentPage: page,
        totalPages,
        total,
        user,
        searchQuery,
        searchField
      })
    } catch (error) {
      // Log the actual error for debugging
      logger.error('Failed to load employees list', { error })
      
      session.flash('error', 'Failed to load employees')
      return view.render('pages/employees/index', {
        employees: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
        user: session.get('user'),
        searchQuery: '',
        searchField: 'all'
      })
    }
  }

  // API: List all employees
  async apiIndex({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const skip = (page - 1) * limit

      // Get search parameters
      const searchQuery = request.input('search', '')
      const searchField = request.input('field', 'all')

      // Build search filter
      const filter: any = {}
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i') // case-insensitive search
        
        if (searchField === 'all') {
          // Search across all fields
          filter.$or = [
            { name: regex },
            { position: regex },
            { department: regex }
          ]
        } else {
          // Search specific field
          filter[searchField] = regex
        }
      }

      const total = await Employee.countDocuments(filter)
      const employees = await Employee.find(filter)
        .populate('created_by', 'name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)

      return response.json({
        data: employees,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
          search: searchQuery,
          searchField: searchField
        }
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to fetch employees'
      })
    }
  }

  // Show single employee
  async show({ params, view, session, response, logger }: HttpContext) {
    try {
      const employee = await Employee.findById(params.id)
        .populate('created_by', 'name email')

      if (!employee) {
        session.flash('error', 'Employee not found')
        return response.redirect().toRoute('employees.index')
      }

      const user = session.get('user')

      return view.render('pages/employees/show', {
        employee,
        user
      })
    } catch (error) {
      // Log the actual error for debugging
      logger.error('Failed to load employee details', { error, params })
      
      session.flash('error', `Failed to load employee details: ${error.message || 'Unknown error'}`)
      return response.redirect().toRoute('employees.index')
    }
  }

  // API: Show single employee
  async apiShow({ params, response }: HttpContext) {
    try {
      const employee = await Employee.findById(params.id)
        .populate('created_by', 'name email')

      if (!employee) {
        return response.status(404).json({
          error: 'Employee not found'
        })
      }

      return response.json({
        data: employee
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to fetch employee'
      })
    }
  }

  // Show employee's own profile (for regular users)
  async profile({ view, session, response }: HttpContext) {
    try {
      const user = session.get('user')

      if (!user) {
        session.flash('error', 'Unauthorized')
        return response.redirect().toRoute('auth.login')
      }

      // Convert user.id string to ObjectId for MongoDB query
      const userId = new mongoose.Types.ObjectId(user.id)

      // Get employee by user_id
      const employee = await Employee.findOne({ user_id: userId })
        .populate('created_by', 'name email')

      if (!employee) {
        session.flash('error', 'Profil karyawan tidak ditemukan. Silakan hubungi admin.')
        return response.redirect().toRoute('auth.login')
      }

      // Format join date for display
      const joinDate = new Date(employee.join_date)
      const formattedJoinDate = joinDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      return view.render('pages/employees/profile', {
        employee: {
          ...employee.toJSON(),
          join_date: formattedJoinDate
        },
        user
      })
    } catch (error: any) {
      session.flash('error', 'Gagal memuat profil')
      return response.redirect().toRoute('auth.login')
    }
  }

  // Show create form
  async create({ view, session }: HttpContext) {
    const user = session.get('user')
    return view.render('pages/employees/form', {
      employee: null,
      user
    })
  }

  // Store new employee
  async store({ request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(createEmployeeValidator)
      const user = session.get('user')

      // Generate email for employee account (use provided email or auto-generate)
      const employeeEmail = data.email || generateEmailFromName(data.name)
      
      // Check if email already exists
      const existingUser = await User.findOne({ email: employeeEmail })
      if (existingUser) {
        session.flash('error', `Email ${employeeEmail} sudah terdaftar. Silakan gunakan email lain.`)
        return response.redirect().back()
      }

 
      

      // Create user account for employee
      const employeeUser = new User({
        name: data.name,
        email: employeeEmail,
        password: 'password', // Default password
        role: 'user' // Employee role
      })
      await employeeUser.save()

      // Create employee record linked to user
      const adminUserId = new mongoose.Types.ObjectId(user.id)
      const employee = new Employee({
        name: data.name,
        position: data.position,
        department: data.department,
        salary: data.salary,
        join_date: data.join_date || new Date(),
        user_id: employeeUser._id, // Link to created user
        created_by: adminUserId
      })
      await employee.save()

      // Store credentials in session to show to admin
      session.flash('success', `Karyawan ${data.name} berhasil dibuat! Email: ${employeeEmail} | Password: password`)
      
      return response.redirect().toRoute('employees.index')
    } catch (error: any) {
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', 'Failed to create employee')
      }
      return response.redirect().back()
    }
  }

  // API: Create employee
  async apiStore({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(createEmployeeValidator)
      const user = request.user

      if (!user) {
        return response.status(401).json({
          error: 'Unauthorized'
        })
      }

      // Generate email for employee account
      const employeeEmail = data.email || generateEmailFromName(data.name)
      
      // Check if email already exists
      const existingUser = await User.findOne({ email: employeeEmail })
      if (existingUser) {
        return response.status(400).json({
          error: `Email ${employeeEmail} already registered. Please use different email.`
        })
      }

      // Generate random password
      const generatedPassword = generatePassword(12)

      // Create user account
      const employeeUser = new User({
        name: data.name,
        email: employeeEmail,
        password: generatedPassword,
        role: 'user'
      })
      await employeeUser.save()

      // Create employee record
      const employee = new Employee({
        name: data.name,
        position: data.position,
        department: data.department,
        salary: data.salary,
        join_date: data.join_date || new Date(),
        user_id: employeeUser._id,
        created_by: user._id
      })
      await employee.save()

      return response.status(201).json({
        message: 'Employee created successfully',
        data: employee,
        credentials: {
          email: employeeEmail,
          password: generatedPassword
        }
      })
    } catch (error: any) {
      return response.status(400).json({
        error: error.messages || 'Failed to create employee'
      })
    }
  }

  // Show edit form
  async edit({ params, view, session, response, logger }: HttpContext) {
    try {
      const employee = await Employee.findById(params.id)

      if (!employee) {
        session.flash('error', 'Employee not found')
        return response.redirect().toRoute('employees.index')
      }

      const user = session.get('user')

      return view.render('pages/employees/form', {
        employee,
        user
      })
    } catch (error) {
      // Log the actual error for debugging
      logger.error('Failed to load employee for editing', { error, params })
      
      session.flash('error', `Failed to load employee: ${error.message || 'Unknown error'}`)
      return response.redirect().toRoute('employees.index')
    }
  }

  // Update employee
  async update({ params, request, response, session }: HttpContext) {
    try {
      const data = await request.validateUsing(updateEmployeeValidator)
      
      const employee = await Employee.findById(params.id)

      if (!employee) {
        session.flash('error', 'Employee not found')
        return response.redirect().toRoute('employees.index')
      }

      // Update fields (user_id cannot be changed after creation)
      if (data.name) employee.name = data.name
      if (data.position) employee.position = data.position
      if (data.department) employee.department = data.department
      if (data.salary !== undefined) employee.salary = data.salary
      if (data.join_date) employee.join_date = data.join_date

      await employee.save()

      session.flash('success', 'Employee updated successfully')
      return response.redirect().toRoute('employees.show', { id: String(employee._id) })
    } catch (error: any) {
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', 'Failed to update employee')
      }
      return response.redirect().back()
    }
  }

  // API: Update employee
  async apiUpdate({ params, request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(updateEmployeeValidator)
      
      const employee = await Employee.findById(params.id)

      if (!employee) {
        return response.status(404).json({
          error: 'Employee not found'
        })
      }

      // Update fields
      if (data.name) employee.name = data.name
      if (data.position) employee.position = data.position
      if (data.department) employee.department = data.department
      if (data.salary !== undefined) employee.salary = data.salary
      if (data.join_date) employee.join_date = data.join_date

      await employee.save()

      return response.json({
        message: 'Employee updated successfully',
        data: employee
      })
    } catch (error: any) {
      return response.status(400).json({
        error: error.messages || 'Failed to update employee'
      })
    }
  }

  // Delete employee
  async destroy({ params, response, session, request }: HttpContext) {
    try {
      const employee = await Employee.findById(params.id)

      if (!employee) {
        // Check if it's an AJAX request
        if (request.header('X-Requested-With') === 'XMLHttpRequest' || 
            request.accepts(['html', 'json']) === 'json') {
          return response.status(404).json({
            error: 'Employee not found'
          })
        }
        session.flash('error', 'Employee not found')
        return response.redirect().toRoute('employees.index')
      }

      await Employee.findByIdAndDelete(params.id)

      // Check if it's an AJAX request
      if (request.header('X-Requested-With') === 'XMLHttpRequest' || 
          request.accepts(['html', 'json']) === 'json') {
        return response.json({
          message: 'Employee deleted successfully'
        })
      }

      session.flash('success', 'Employee deleted successfully')
      return response.redirect().toRoute('employees.index')
    } catch (error) {
      // Check if it's an AJAX request
      if (request.header('X-Requested-With') === 'XMLHttpRequest' || 
          request.accepts(['html', 'json']) === 'json') {
        return response.status(500).json({
          error: 'Failed to delete employee'
        })
      }
      session.flash('error', 'Failed to delete employee')
      return response.redirect().back()
    }
  }

  // API: Delete employee
  async apiDestroy({ params, response }: HttpContext) {
    try {
      const employee = await Employee.findById(params.id)

      if (!employee) {
        return response.status(404).json({
          error: 'Employee not found'
        })
      }

      await Employee.findByIdAndDelete(params.id)

      return response.json({
        message: 'Employee deleted successfully'
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Failed to delete employee'
      })
    }
  }
}
