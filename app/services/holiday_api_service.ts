import axios from 'axios'
import env from '#start/env'
import Holiday from '#models/holiday'
import mongoose from 'mongoose'

/**
 * Service untuk mengintegrasikan HolidayAPI.com
 * Dokumentasi: https://holidayapi.com/docs
 */
export default class HolidayApiService {
  private apiKey: string
  private baseURL: string = 'https://holidayapi.com/v1'

  constructor() {
    this.apiKey = env.get('HOLIDAY_API_KEY', '')
    if (!this.apiKey) {
      console.warn('⚠️ HOLIDAY_API_KEY not found in .env file')
    }
  }

  /**
   * Fetch holidays dari HolidayAPI untuk negara dan tahun tertentu
   * Note: Free tier hanya bisa akses tahun lalu (2024)
   */
  async fetchHolidays(country: string = 'ID', year: number = 2024) {
    try {
      if (!this.apiKey) {
        throw new Error('HOLIDAY_API_KEY is required. Please add it to your .env file')
      }

      console.log(`📅 Fetching holidays for ${country} ${year} from HolidayAPI...`)

      const response = await axios.get(`${this.baseURL}/holidays`, {
        params: {
          key: this.apiKey,
          country,
          year,
          public: true, // Only public holidays
          language: 'id' // Indonesian language
        }
      })

      console.log('📦 API Response:', JSON.stringify(response.data, null, 2))

      if (response.data.status !== 200) {
        throw new Error(`HolidayAPI error: ${response.data.error || 'Unknown error'}`)
      }

      const holidays = response.data.holidays
      console.log(`✅ Found ${holidays ? holidays.length : 0} holidays from API`)
      
      if (holidays && holidays.length > 0) {
        console.log('📝 First holiday sample:', JSON.stringify(holidays[0], null, 2))
      }

      return holidays || []
    } catch (error: any) {
      console.error('❌ Failed to fetch holidays from HolidayAPI:', error.message)
      if (error.response) {
        console.error('Response data:', error.response.data)
      }
      throw error
    }
  }

  /**
   * Import holidays dari HolidayAPI ke database
   * Akan skip holidays yang sudah ada
   */
  async importHolidays(
    country: string = 'ID', 
    year: number = new Date().getFullYear(),
    userId: string
  ) {
    try {
      const apiHolidays = await this.fetchHolidays(country, year)
      
      if (!apiHolidays || apiHolidays.length === 0) {
        console.log('⚠️ No holidays returned from API')
        return { success: false, imported: 0, skipped: 0, total: 0 }
      }

      
      let imported = 0
      let skipped = 0
      let errors = 0

      for (const apiHoliday of apiHolidays) {
        try {
          console.log(`\n📌 Processing: ${apiHoliday.name} on ${apiHoliday.date}`)
          
          // Parse date and normalize to UTC midnight
          const dateString = apiHoliday.date
          const [year, month, day] = dateString.split('-').map(Number)
          const holidayDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
          
          console.log(`   Normalized date: ${holidayDate.toISOString()}`)
          
          // Validate date
          if (isNaN(holidayDate.getTime())) {
            console.log(`❌ Invalid date: ${apiHoliday.date}`)
            errors++
            continue
          }
        
          // Check if already exists by comparing date components
          const exists = await Holiday.findOne({
            name: apiHoliday.name
          })
          
          if (exists) {
            const existsYear = exists.date.getUTCFullYear()
            const existsMonth = exists.date.getUTCMonth()
            const existsDay = exists.date.getUTCDate()
            
            if (existsYear === year && existsMonth === month - 1 && existsDay === day) {
              console.log(`⏭️  Skipped (already exists): ${apiHoliday.name}`)
              skipped++
              continue
            }
          }

          if (exists) {
            console.log(`⏭️  Skipped (already exists): ${apiHoliday.name}`)
            skipped++
            continue
          }

          // Determine holiday type based on observed flag
          let type: 'national' | 'religious' | 'company' | 'other' = 'national'
          
          // Check if it's a religious holiday by name
          const religiousKeywords = ['idul', 'natal', 'nyepi', 'waisak', 'imlek', 'kenaikan', 'maulid', 'isra', 'mi\'raj']
          if (religiousKeywords.some(keyword => apiHoliday.name.toLowerCase().includes(keyword))) {
            type = 'religious'
          }

          // Create new holiday
          const holiday = new Holiday({
            name: apiHoliday.name,
            date: holidayDate,
            type,
            is_recurring: true, // Most public holidays recur yearly
            description: apiHoliday.observed ? `Observed on ${apiHoliday.observed}` : '',
            created_by: new mongoose.Types.ObjectId(userId)
          })

          console.log(`💾 Saving holiday:`, {
            name: holiday.name,
            date: holiday.date,
            type: holiday.type
          })

          await holiday.save()
          console.log(`✅ Saved successfully: ${holiday.name}`)
          imported++
        } catch (itemError: any) {
          console.error(`❌ Error processing holiday "${apiHoliday.name}":`, itemError.message)
          errors++
        }
      }

      return {
        success: true,
        imported,
        skipped,
        total: apiHolidays.length
      }
    } catch (error: any) {
      console.error('❌ Failed to import holidays:', error.message)
      throw error
    }
  }

  /**
   * Fetch upcoming holidays from HolidayAPI
   */
  async fetchUpcomingHolidays(country: string = 'ID') {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ HOLIDAY_API_KEY not found, skipping API call')
        return []
      }

      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth() + 1 // 1-12
      const day = today.getDate()

      const response = await axios.get(`${this.baseURL}/holidays`, {
        params: {
          key: this.apiKey,
          country,
          year,
          month,
          day,
          upcoming: true,
          public: true,
          language: 'id'
        }
      })

      if (response.data.status !== 200) {
        throw new Error(`HolidayAPI error: ${response.data.error || 'Unknown error'}`)
      }

      return response.data.holidays || []
    } catch (error: any) {
      console.error('❌ Failed to fetch upcoming holidays:', error.message)
      return []
    }
  }
}
