import type { HttpContext } from '@adonisjs/core/http'
import Attendance from '#models/attendance'
import Employee from '#models/employee'
import worldTimeService from '#services/world_time_service'
import HolidayService from '#services/holiday_service'
import { checkInValidator, checkOutValidator } from '#validators/attendance_validator'
import '#types/request'
import mongoose from 'mongoose'

export default class AbsensiController {
  private holidayService: HolidayService

  constructor() {
    this.holidayService = new HolidayService()
  }

  // ============================================
  // WEB ROUTES
  // ============================================

  /**
   * Show attendance page with today's status
   */
  async index({ view, session, response }: HttpContext) {
    try {
      const user = session.get('user')
      
      if (!user) {
        session.flash('error', 'Unauthorized')
        return response.redirect().toRoute('auth.login')
      }

      // Admin tidak boleh absen
      if (user.role === 'admin') {
        session.flash('error', 'Admin tidak dapat melakukan absensi. Fitur ini hanya untuk karyawan.')
        return response.redirect().toRoute('employees.index')
      }

      // Convert user.id string to ObjectId for MongoDB query
      const userId = new mongoose.Types.ObjectId(user.id)

      // Get employee by user_id (proper relationship)
      let employee = await Employee.findOne({ user_id: userId })
      
      // Fallback: If no employee linked to this user, show helpful message
      if (!employee) {
        session.flash('error', 'Akun Anda belum terhubung dengan data karyawan. Silakan hubungi admin untuk membuat profil karyawan Anda.')
        return response.redirect().toRoute('employees.index')
      }

      // Get current date from WorldTimeAPI
      const currentDateTime = await worldTimeService.getCurrentDateTime()
      const startOfToday = await worldTimeService.getStartOfToday()
      const endOfToday = await worldTimeService.getEndOfToday()

      // Get today's attendance
      const todayAttendance = await Attendance.findOne({
        employee_id: employee._id,
        date: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      })

      // Get recent attendance (last 7 days)
      const sevenDaysAgo = new Date(startOfToday)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentAttendance = await Attendance.find({
        employee_id: employee._id,
        date: { $gte: sevenDaysAgo }
      })
        .sort({ date: -1 })
        .limit(7)

      return view.render('pages/absensi/index', {
        user,
        employee,
        todayAttendance,
        recentAttendance,
        currentDateTime,
        currentDateTimeFormatted: worldTimeService.formatDateTime(currentDateTime)
      })
    } catch (error: any) {
      session.flash('error', `Failed to load attendance: ${error.message}`)
      return response.redirect().toRoute('employees.index')
    }
  }

  /**
   * Admin Dashboard - Overview of all attendance
   */
  async dashboard({ view, session, response }: HttpContext) {
    try {
      const user = session.get('user')
      
      if (!user || user.role !== 'admin') {
        session.flash('error', 'Unauthorized')
        return response.redirect().toRoute('auth.login')
      }

      // Get current date info
      const startOfToday = await worldTimeService.getStartOfToday()
      const endOfToday = await worldTimeService.getEndOfToday()
      const currentDateTime = await worldTimeService.getCurrentDateTime()

      // Get today's attendance summary
      const todayAttendances = await Attendance.find({
        date: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      }).populate('employee_id', 'name position department')

      // Get all employees count
      const totalEmployees = await Employee.countDocuments()

      // Count attendance statistics for today
      const todayPresent = todayAttendances.filter(a => a.status === 'present').length
      const todayLate = todayAttendances.filter(a => a.status === 'late').length
      const todayAbsent = totalEmployees - todayAttendances.length

      // Get recent attendance (last 10)
      const recentAttendances = await Attendance.find()
        .populate('employee_id', 'name position department')
        .sort({ date: -1, check_in: -1 })
        .limit(10)

      // Get upcoming holidays (next 5)
      const upcomingHolidays = await this.holidayService.getUpcomingHolidays(5)
      console.log('📅 Upcoming Holidays:', upcomingHolidays.length, 'found')
      console.log('Holidays data:', JSON.stringify(upcomingHolidays, null, 2))

      // Format dates for display
      const formattedRecentAttendances = recentAttendances.map(attendance => ({
        ...attendance.toJSON(),
        dateFormatted: worldTimeService.formatDateTime(attendance.date),
        checkInFormatted: attendance.check_in ? worldTimeService.formatDateTime(attendance.check_in) : '-',
        checkOutFormatted: attendance.check_out ? worldTimeService.formatDateTime(attendance.check_out) : '-'
      }))

      const formattedTodayAttendances = todayAttendances.map(attendance => ({
        ...attendance.toJSON(),
        checkInFormatted: attendance.check_in ? worldTimeService.formatDateTime(attendance.check_in) : '-',
        checkOutFormatted: attendance.check_out ? worldTimeService.formatDateTime(attendance.check_out) : '-'
      }))

      return view.render('pages/dashboard/index', {
        user,
        currentDateTime: worldTimeService.formatDateTime(currentDateTime),
        totalEmployees,
        todayPresent,
        todayLate,
        todayAbsent,
        todayAttendances: formattedTodayAttendances,
        recentAttendances: formattedRecentAttendances,
        upcomingHolidays
      })
    } catch (error: any) {
      session.flash('error', `Failed to load dashboard: ${error.message}`)
      return response.redirect().toRoute('employees.index')
    }
  }

  /**
   * Process check-in
   */
  async checkIn({ request, session, response }: HttpContext) {
    try {
      const data = await request.validateUsing(checkInValidator)
      const user = session.get('user')

      if (!user) {
        session.flash('error', 'Unauthorized')
        return response.redirect().toRoute('auth.login')
      }

      // Admin tidak boleh absen
      if (user.role === 'admin') {
        session.flash('error', 'Admin tidak dapat melakukan absensi.')
        return response.redirect().back()
      }

      // Convert user.id string to ObjectId for MongoDB query
      const userId = new mongoose.Types.ObjectId(user.id)

      // Get employee by user_id
      const employee = await Employee.findOne({ user_id: userId })
      
      if (!employee) {
        session.flash('error', 'Akun Anda belum terhubung dengan data karyawan. Silakan hubungi admin.')
        return response.redirect().back()
      }

      // Get current datetime from WorldTimeAPI
      const currentDateTime = await worldTimeService.getCurrentDateTime()
      const startOfToday = await worldTimeService.getStartOfToday()

      // Check if today is a holiday
      const todayHoliday = await this.holidayService.getHolidayByDate(currentDateTime)
      if (todayHoliday) {
        console.log('🚫 Check-in blocked: Holiday detected -', todayHoliday.name)
        session.flash('error', `Hari ini adalah hari libur (${todayHoliday.name}). Anda tidak perlu melakukan absensi.`)
        return response.redirect().back()
      }
      console.log('✅ No holiday detected, proceeding with check-in')

      // Check if already checked in today
      const existingAttendance = await Attendance.findOne({
        employee_id: employee._id,
        date: {
          $gte: startOfToday,
          $lte: await worldTimeService.getEndOfToday()
        }
      })

      if (existingAttendance) {
        session.flash('error', 'Anda sudah melakukan check-in hari ini')
        return response.redirect().back()
      }

      // Create attendance record
      const attendance = new Attendance({
        employee_id: employee._id,
        date: currentDateTime, // Use currentDateTime instead of startOfToday
        check_in: currentDateTime,
        notes: data.notes || ''
      })

      await attendance.save()
      const statusMessage = attendance.status === 'late' 
        ? `Check-in berhasil! Anda terlambat ${attendance.late_duration} menit`
        : 'Check-in berhasil! Anda tepat waktu'

      session.flash('success', statusMessage)
      return response.redirect().toRoute('absensi.index')
    } catch (error: any) {
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', `Check-in gagal: ${error.message}`)
      }
      return response.redirect().back()
    }
  }

  /**
   * Process check-out
   */
  async checkOut({ request, session, response }: HttpContext) {
    try {
      const data = await request.validateUsing(checkOutValidator)
      const user = session.get('user')

      if (!user) {
        session.flash('error', 'Unauthorized')
        return response.redirect().toRoute('auth.login')
      }

      // Admin tidak boleh absen
      if (user.role === 'admin') {
        session.flash('error', 'Admin tidak dapat melakukan absensi.')
        return response.redirect().back()
      }

      // Convert user.id string to ObjectId for MongoDB query
      const userId = new mongoose.Types.ObjectId(user.id)

      // Get employee by user_id
      const employee = await Employee.findOne({ user_id: userId })
      
      if (!employee) {
        session.flash('error', 'Akun Anda belum terhubung dengan data karyawan. Silakan hubungi admin.')
        return response.redirect().back()
      }

      // Get current datetime from WorldTimeAPI
      const currentDateTime = await worldTimeService.getCurrentDateTime()
      const startOfToday = await worldTimeService.getStartOfToday()

      // Find today's attendance
      const attendance = await Attendance.findOne({
        employee_id: employee._id,
        date: {
          $gte: startOfToday,
          $lte: await worldTimeService.getEndOfToday()
        }
      })

      if (!attendance) {
        session.flash('error', 'Anda belum melakukan check-in hari ini')
        return response.redirect().back()
      }

      if (attendance.check_out) {
        session.flash('error', 'Anda sudah melakukan check-out hari ini')
        return response.redirect().back()
      }

      // Update check-out time
      attendance.check_out = currentDateTime
      if (data.notes) {
        attendance.notes = (attendance.notes ? attendance.notes + ' | ' : '') + data.notes
      }
      
      await attendance.save()

      const workHours = Math.floor(attendance.work_duration! / 60)
      const workMinutes = attendance.work_duration! % 60

      session.flash('success', `Check-out berhasil! Durasi kerja: ${workHours} jam ${workMinutes} menit`)
      return response.redirect().toRoute('absensi.index')
    } catch (error: any) {
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', `Check-out gagal: ${error.message}`)
      }
      return response.redirect().back()
    }
  }

  /**
   * Show attendance history with filters
   */
  async history({ request, view, session, response }: HttpContext) {
    try {
      const user = session.get('user')
      
      if (!user) {
        session.flash('error', 'Unauthorized')
        return response.redirect().toRoute('auth.login')
      }

      const page = request.input('page', 1)
      const limit = 20
      const skip = (page - 1) * limit

      // Get filters
      const startDate = request.input('start_date')
      const endDate = request.input('end_date')
      const status = request.input('status')

      // Build query based on user role
      let query: any = {}
      
      if (user.role === 'admin') {
        // Admin can view all attendance with optional employee filter
        const employeeId = request.input('employee_id')
        if (employeeId) {
          query.employee_id = employeeId
        }
      } else {
        // Regular user can only view their own attendance
        const userId = new mongoose.Types.ObjectId(user.id)
        const employee = await Employee.findOne({ user_id: userId })
        if (!employee) {
          session.flash('error', 'Akun Anda belum terhubung dengan data karyawan. Silakan hubungi admin.')
          return response.redirect().toRoute('employees.index')
        }
        query.employee_id = employee._id
      }

      // Add date filters
      if (startDate || endDate) {
        query.date = {}
        if (startDate) query.date.$gte = new Date(startDate)
        if (endDate) query.date.$lte = new Date(endDate)
      }

      // Add status filter
      if (status) {
        query.status = status
      }

      const total = await Attendance.countDocuments(query)
      const attendances = await Attendance.find(query)
        .populate('employee_id', 'name position department')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)

      const totalPages = Math.ceil(total / limit)

      // Get all employees for admin filter
      let employees: any[] = []
      if (user.role === 'admin') {
        employees = await Employee.find().select('name position').sort({ name: 1 })
      }

      // Check which dates are holidays
      const attendancesWithHolidays = await Promise.all(
        attendances.map(async (attendance) => {
          const holiday = await this.holidayService.getHolidayByDate(attendance.date)
          return {
            ...attendance.toJSON(),
            holiday: holiday ? { name: holiday.name, type: holiday.type } : null
          }
        })
      )

      return view.render('pages/absensi/history', {
        user,
        attendances: attendancesWithHolidays,
        employees,
        currentPage: page,
        totalPages,
        total,
        filters: {
          start_date: startDate,
          end_date: endDate,
          status,
          employee_id: request.input('employee_id')
        }
      })
    } catch (error: any) {
      session.flash('error', `Failed to load history: ${error.message}`)
      return response.redirect().toRoute('absensi.index')
    }
  }

  // ============================================
  // API ROUTES
  // ============================================

  /**
   * API: Get attendance list with filters
   */
  async apiIndex({ request, response }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const skip = (page - 1) * limit

      // Build query
      let query: any = {}
      
      if (user.role === 'admin') {
        const employeeId = request.input('employee_id')
        if (employeeId) query.employee_id = employeeId
      } else {
        const userId = new mongoose.Types.ObjectId(user._id)
        const employee = await Employee.findOne({ user_id: userId })
        if (!employee) {
          return response.status(404).json({ error: 'Employee record not found. Please contact admin to link your account.' })
        }
        query.employee_id = employee._id
      }

      // Date filters
      const startDate = request.input('start_date')
      const endDate = request.input('end_date')
      if (startDate || endDate) {
        query.date = {}
        if (startDate) query.date.$gte = new Date(startDate)
        if (endDate) query.date.$lte = new Date(endDate)
      }

      // Status filter
      const status = request.input('status')
      if (status) query.status = status

      const total = await Attendance.countDocuments(query)
      const attendances = await Attendance.find(query)
        .populate('employee_id', 'name position department')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)

      return response.json({
        data: attendances,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      return response.status(500).json({ error: error.message })
    }
  }

  /**
   * API: Check-in
   */
  async apiCheckIn({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(checkInValidator)
      const user = request.user

      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Admin tidak boleh absen
      if (user.role === 'admin') {
        return response.status(403).json({ error: 'Admin cannot perform attendance. This feature is for employees only.' })
      }

      const userId = new mongoose.Types.ObjectId(user._id)
      const employee = await Employee.findOne({ user_id: userId })
      if (!employee) {
        return response.status(404).json({ error: 'Employee record not found. Please contact admin to link your account.' })
      }

      const currentDateTime = await worldTimeService.getCurrentDateTime()
      const startOfToday = await worldTimeService.getStartOfToday()

      // Check existing attendance
      const existingAttendance = await Attendance.findOne({
        employee_id: employee._id,
        date: {
          $gte: startOfToday,
          $lte: await worldTimeService.getEndOfToday()
        }
      })

      if (existingAttendance) {
        return response.status(400).json({ error: 'Already checked in today' })
      }

      const attendance = new Attendance({
        employee_id: employee._id,
        date: startOfToday,
        check_in: currentDateTime,
        notes: data.notes || ''
      })

      await attendance.save()

      return response.status(201).json({
        message: 'Check-in successful',
        data: attendance
      })
    } catch (error: any) {
      return response.status(400).json({ error: error.messages || error.message })
    }
  }

  /**
   * API: Check-out
   */
  async apiCheckOut({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(checkOutValidator)
      const user = request.user

      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Admin tidak boleh absen
      if (user.role === 'admin') {
        return response.status(403).json({ error: 'Admin cannot perform attendance. This feature is for employees only.' })
      }

      const userId = new mongoose.Types.ObjectId(user._id)
      const employee = await Employee.findOne({ user_id: userId })
      if (!employee) {
        return response.status(404).json({ error: 'Employee record not found. Please contact admin to link your account.' })
      }

      const currentDateTime = await worldTimeService.getCurrentDateTime()
      const startOfToday = await worldTimeService.getStartOfToday()

      const attendance = await Attendance.findOne({
        employee_id: employee._id,
        date: {
          $gte: startOfToday,
          $lte: await worldTimeService.getEndOfToday()
        }
      })

      if (!attendance) {
        return response.status(400).json({ error: 'No check-in record found today' })
      }

      if (attendance.check_out) {
        return response.status(400).json({ error: 'Already checked out today' })
      }

      attendance.check_out = currentDateTime
      if (data.notes) {
        attendance.notes = (attendance.notes ? attendance.notes + ' | ' : '') + data.notes
      }
      
      await attendance.save()

      return response.json({
        message: 'Check-out successful',
        data: attendance
      })
    } catch (error: any) {
      return response.status(400).json({ error: error.messages || error.message })
    }
  }

  /**
   * API: Get single attendance record
   */
  async apiShow({ params, response, request }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const attendance = await Attendance.findById(params.id)
        .populate('employee_id', 'name position department')

      if (!attendance) {
        return response.status(404).json({ error: 'Attendance not found' })
      }

      // Check authorization
      if (user.role !== 'admin') {
        const userId = new mongoose.Types.ObjectId(user._id)
        const employee = await Employee.findOne({ user_id: userId })
        if (!employee || String(attendance.employee_id._id) !== String(employee._id)) {
          return response.status(403).json({ error: 'Forbidden' })
        }
      }

      return response.json({ data: attendance })
    } catch (error: any) {
      return response.status(500).json({ error: error.message })
    }
  }
}
