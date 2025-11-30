import type { HttpContext } from '@adonisjs/core/http'
import Holiday from '#models/holiday'
import HolidayService from '#services/holiday_service'
import HolidayApiService from '#services/holiday_api_service'
import { createHolidayValidator, updateHolidayValidator } from '#validators/holiday_validator'
import mongoose from 'mongoose'

export default class HolidayController {
  private holidayService: HolidayService
  private holidayApiService: HolidayApiService

  constructor() {
    this.holidayService = new HolidayService()
    this.holidayApiService = new HolidayApiService()
  }

  /**
   * Display list of holidays with filters
   */
  async index({ request, view, session }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 20
    const year = request.input('year', 2024)
    const month = request.input('month')
    const type = request.input('type')

    try {
      let query: any = {}

      // Filter by year
      if (year) {
        const startOfYear = new Date(year, 0, 1)
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
        query.date = { $gte: startOfYear, $lte: endOfYear }
      }

      // Filter by month (0-11)
      if (month !== undefined && month !== null && month !== '') {
        const monthNum = parseInt(month)
        const startOfMonth = new Date(year, monthNum, 1)
        const endOfMonth = new Date(year, monthNum + 1, 0, 23, 59, 59, 999)
        query.date = { $gte: startOfMonth, $lte: endOfMonth }
      }

      // Filter by type
      if (type) {
        query.type = type
      }

      const skip = (page - 1) * limit
      const holidays = await Holiday.find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .populate('created_by', 'name email')

      const total = await Holiday.countDocuments(query)
      const totalPages = Math.ceil(total / limit)

      // Get upcoming holidays for sidebar
      const upcomingHolidays = await this.holidayService.getUpcomingHolidays(5)

      return view.render('pages/holidays/index', {
        holidays,
        currentPage: page,
        totalPages,
        total,
        year,
        month,
        type,
        upcomingHolidays,
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error')
      })
    } catch (error) {
      console.error('Error fetching holidays:', error)
      session.flash('error', 'Gagal mengambil data hari libur')
      return view.render('pages/holidays/index', {
        holidays: [],
        currentPage: 1,
        totalPages: 0,
        total: 0,
        year,
        month,
        type,
        upcomingHolidays: [],
        error: session.flashMessages.get('error')
      })
    }
  }

  /**
   * Display list of holidays for employees (read-only)
   */
  async employeeIndex({ request, view }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 20
    const year = request.input('year', 2024)
    const month = request.input('month')
    const type = request.input('type')

    try {
      let query: any = {}

      // Filter by year
      if (year) {
        const startOfYear = new Date(year, 0, 1)
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
        query.date = { $gte: startOfYear, $lte: endOfYear }
      }

      // Filter by month (0-11)
      if (month !== undefined && month !== null && month !== '') {
        const monthNum = parseInt(month)
        const startOfMonth = new Date(year, monthNum, 1)
        const endOfMonth = new Date(year, monthNum + 1, 0, 23, 59, 59, 999)
        query.date = { $gte: startOfMonth, $lte: endOfMonth }
      }

      // Filter by type
      if (type) {
        query.type = type
      }

      const skip = (page - 1) * limit
      const holidays = await Holiday.find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)

      const total = await Holiday.countDocuments(query)
      const totalPages = Math.ceil(total / limit)

      // Get upcoming holidays
      const upcomingHolidays = await this.holidayService.getUpcomingHolidays(5)

      return view.render('pages/holidays/employee', {
        holidays,
        currentPage: page,
        totalPages,
        total,
        year,
        month,
        type,
        upcomingHolidays
      })
    } catch (error) {
      console.error('Error fetching holidays:', error)
      return view.render('pages/holidays/employee', {
        holidays: [],
        currentPage: 1,
        totalPages: 0,
        total: 0,
        year,
        month,
        type,
        upcomingHolidays: []
      })
    }
  }

  /**
   * Show form to create a new holiday
   */
  async create({ view, session }: HttpContext) {
    return view.render('pages/holidays/form', {
      holiday: null,
      action: 'create',
      error: session.flashMessages.get('error'),
      errors: session.flashMessages.get('errors')
    })
  }

  /**
   * Store a new holiday
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const user = session.get('user')
      if (!user) {
        session.flash('error', 'Anda harus login terlebih dahulu')
        return response.redirect().toRoute('auth.login')
      }

      const data = await request.validateUsing(createHolidayValidator)

      // Normalize date to UTC midnight to ensure consistent comparison
      const inputDate = new Date(data.date)
      const normalizedDate = new Date(Date.UTC(
        inputDate.getFullYear(),
        inputDate.getMonth(),
        inputDate.getDate(),
        0, 0, 0, 0
      ))

      const holiday = new Holiday({
        name: data.name,
        date: normalizedDate,
        type: data.type,
        is_recurring: data.is_recurring,
        description: data.description,
        created_by: new mongoose.Types.ObjectId(user.id)
      })

      await holiday.save()

      session.flash('success', 'Hari libur berhasil ditambahkan')
      return response.redirect().toRoute('holidays.index')
    } catch (error) {
      console.error('Error creating holiday:', error)
      
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', 'Gagal menambahkan hari libur')
      }
      
      return response.redirect().back()
    }
  }

  /**
   * Show a single holiday
   */
  async show({ params, view, response, session }: HttpContext) {
    try {
      const holiday = await Holiday.findById(params.id).populate('created_by', 'name email')

      if (!holiday) {
        session.flash('error', 'Hari libur tidak ditemukan')
        return response.redirect().toRoute('holidays.index')
      }

      return view.render('pages/holidays/show', { holiday })
    } catch (error) {
      console.error('Error fetching holiday:', error)
      session.flash('error', 'Gagal mengambil data hari libur')
      return response.redirect().toRoute('holidays.index')
    }
  }

  /**
   * Show form to edit a holiday
   */
  async edit({ params, view, response, session }: HttpContext) {
    try {
      const holiday = await Holiday.findById(params.id)

      if (!holiday) {
        session.flash('error', 'Hari libur tidak ditemukan')
        return response.redirect().toRoute('holidays.index')
      }

      return view.render('pages/holidays/form', {
        holiday,
        action: 'edit',
        error: session.flashMessages.get('error'),
        errors: session.flashMessages.get('errors')
      })
    } catch (error) {
      console.error('Error fetching holiday:', error)
      session.flash('error', 'Gagal mengambil data hari libur')
      return response.redirect().toRoute('holidays.index')
    }
  }

  /**
   * Update a holiday
   */
  async update({ params, request, response, session }: HttpContext) {
    try {
      const holiday = await Holiday.findById(params.id)

      if (!holiday) {
        session.flash('error', 'Hari libur tidak ditemukan')
        return response.redirect().toRoute('holidays.index')
      }

      const data = await request.validateUsing(updateHolidayValidator)

      // Normalize date if provided
      if (data.date) {
        const inputDate = new Date(data.date)
        data.date = new Date(Date.UTC(
          inputDate.getFullYear(),
          inputDate.getMonth(),
          inputDate.getDate(),
          0, 0, 0, 0
        ))
      }

      Object.assign(holiday, data)
      await holiday.save()

      session.flash('success', 'Hari libur berhasil diperbarui')
      return response.redirect().toRoute('holidays.index')
    } catch (error) {
      console.error('Error updating holiday:', error)
      
      if (error.messages) {
        session.flash('errors', error.messages)
      } else {
        session.flash('error', 'Gagal memperbarui hari libur')
      }
      
      return response.redirect().back()
    }
  }

  /**
   * Delete a holiday
   */
  async destroy({ params, response, session }: HttpContext) {
    try {
      console.log('🗑️ Delete holiday request for ID:', params.id)
      
      const holiday = await Holiday.findById(params.id)

      if (!holiday) {
        console.log('❌ Holiday not found:', params.id)
        session.flash('error', 'Hari libur tidak ditemukan')
        return response.redirect().toRoute('holidays.index')
      }

      console.log('📌 Found holiday to delete:', { name: holiday.name, date: holiday.date })
      await holiday.deleteOne()
      console.log('✅ Holiday deleted successfully')

      session.flash('success', 'Hari libur berhasil dihapus')
      return response.redirect().toRoute('holidays.index')
    } catch (error: any) {
      console.error('❌ Error deleting holiday:', error)
      console.error('Error details:', error.message, error.stack)
      session.flash('error', `Gagal menghapus hari libur: ${error.message}`)
      return response.redirect().toRoute('holidays.index')
    }
  }

  /**
   * Import holidays dari HolidayAPI
   * Note: Free tier hanya bisa akses tahun 2024
   */
  async importFromApi({ response, session }: HttpContext) {
    try {
      const user = session.get('user')
      if (!user) {
        return response.redirect('/auth/login')
      }

      // Free tier hanya bisa akses 2024
      const year = 2024
      console.log('🚀 Starting holiday import for ID', year)
      console.log('👤 User ID:', user.id)

      const result = await this.holidayApiService.importHolidays('ID', year, user.id)
      console.log('📊 Import Result:', result)

      session.flash('success', `Berhasil import ${result.imported} hari libur, ${result.skipped} sudah ada`)
      return response.redirect().toRoute('holidays.index')
    } catch (error) {
      console.error('❌ Import failed:', error)
      session.flash('error', `Gagal import hari libur: ${error.message}`)
      return response.redirect().toRoute('holidays.index')
    }
  }
}
