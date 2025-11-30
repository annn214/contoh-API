import Holiday from '#models/holiday'

/**
 * Service for managing holidays and checking holiday dates
 */
export default class HolidayService {
  /**
   * Check if a given date is a holiday
   */
  async isHoliday(date: Date): Promise<boolean> {
    const holiday = await this.getHolidayByDate(date)
    return holiday !== null
  }

  /**
   * Get holiday details for a specific date
   * Uses WITA timezone (Asia/Makassar) for date comparison
   */
  async getHolidayByDate(date: Date) {
    // Get date components in local timezone (WITA from WorldTimeAPI)
    const inputYear = date.getFullYear()
    const inputMonth = date.getMonth()
    const inputDay = date.getDate()
    
    console.log(`🔍 Checking holiday for WITA date: ${inputYear}-${String(inputMonth + 1).padStart(2, '0')}-${String(inputDay).padStart(2, '0')}`)
    console.log(`   Input date full: ${date.toISOString()} (${date.toString()})`)

    // Find holidays where the date component matches (ignoring time)
    const holidays = await Holiday.find({})
    
    for (const holiday of holidays) {
      // Compare using UTC components since holidays are stored as UTC midnight
      const holidayYear = holiday.date.getUTCFullYear()
      const holidayMonth = holiday.date.getUTCMonth()
      const holidayDay = holiday.date.getUTCDate()
      
      console.log(`  📅 Comparing with: ${holiday.name} (${holidayYear}-${String(holidayMonth + 1).padStart(2, '0')}-${String(holidayDay).padStart(2, '0')})`)
      
      if (holidayYear === inputYear && holidayMonth === inputMonth && holidayDay === inputDay) {
        console.log(`  ✅ MATCH FOUND: ${holiday.name}`)
        return holiday
      }
    }

    console.log(`  ❌ No holiday found for this date`)
    return null
  }

  /**
   * Get all holidays within a date range
   */
  async getHolidaysInRange(startDate: Date, endDate: Date) {
    return await Holiday.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 })
  }

  /**
   * Get upcoming holidays
   */
  async getUpcomingHolidays(limit: number = 5) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await Holiday.find({
      date: { $gte: today }
    })
      .sort({ date: 1 })
      .limit(limit)
      .populate('created_by', 'name email')
  }

  /**
   * Get holidays for a specific year
   */
  async getHolidaysByYear(year: number) {
    const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

    return await Holiday.find({
      date: {
        $gte: startOfYear,
        $lte: endOfYear
      }
    }).sort({ date: 1 })
  }

  /**
   * Get holidays for a specific month
   */
  async getHolidaysByMonth(year: number, month: number) {
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

    return await Holiday.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ date: 1 })
  }

  /**
   * Count holidays in a date range
   */
  async countHolidaysInRange(startDate: Date, endDate: Date): Promise<number> {
    return await Holiday.countDocuments({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
  }
}
