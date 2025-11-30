import axios from 'axios'

interface WorldTimeAPIResponse {
  datetime: string
  timezone: string
  utc_offset: string
  day_of_week: number
  day_of_year: number
  week_number: number
}

class WorldTimeService {
  private readonly API_URL = 'https://worldtimeapi.org/api/timezone/Asia/Makassar'
  private readonly TIMEOUT = 5000
  private readonly TIMEZONE = 'Asia/Makassar' // WITA (UTC+8)

  /**
   * Get current datetime from WorldTimeAPI
   * Returns Date object in WITA timezone (Asia/Makassar)
   * Falls back to local time if API fails
   */
  async getCurrentDateTime(): Promise<Date> {
    try {
      console.log('🌐 Fetching time from WorldTimeAPI...')
      const response = await axios.get<WorldTimeAPIResponse>(this.API_URL, {
        timeout: this.TIMEOUT
      })

      if (response.data && response.data.datetime) {
        // Parse the datetime string which is in WITA timezone
        const apiDateTime = new Date(response.data.datetime)
        
        console.log('✅ WorldTimeAPI Response:')
        console.log('   Raw datetime:', response.data.datetime)
        console.log('   Parsed Date:', apiDateTime.toString())
        console.log('   ISO:', apiDateTime.toISOString())
        console.log('   Local components:', {
          year: apiDateTime.getFullYear(),
          month: apiDateTime.getMonth() + 1,
          day: apiDateTime.getDate(),
          hours: apiDateTime.getHours(),
          minutes: apiDateTime.getMinutes()
        })
        
        return apiDateTime
      }
      
      return this.getLocalDateTime()
    } catch (error) {
      console.error('❌ Failed to fetch time from WorldTimeAPI:', error)
      // Fallback to local time if API fails
      return this.getLocalDateTime()
    }
  }

  /**
   * Get local datetime (fallback method)
   * Adjusts server time to WITA timezone
   */
  private getLocalDateTime(): Date {
    const serverTime = new Date()
       
    // Get server timezone offset in minutes
    const serverOffset = serverTime.getTimezoneOffset() // negative if ahead of UTC
  
    // WITA is UTC+8 (480 minutes ahead)
    const witaOffset = -480 // negative because getTimezoneOffset returns negative for ahead
    
    // Calculate difference and adjust
    const offsetDifference = serverOffset - witaOffset
    const adjustedTime = new Date(serverTime.getTime() + offsetDifference * 60 * 1000)
    
    return adjustedTime
  }

  /**
   * Get start of today (00:00:00) in Asia/Jakarta timezone
   */
  async getStartOfToday(): Promise<Date> {
    const currentDate = await this.getCurrentDateTime()
    const startOfDay = new Date(currentDate)
    startOfDay.setHours(0, 0, 0, 0)
    return startOfDay
  }

  /**
   * Get end of today (23:59:59) in Asia/Jakarta timezone
   */
  async getEndOfToday(): Promise<Date> {
    const currentDate = await this.getCurrentDateTime()
    const endOfDay = new Date(currentDate)
    endOfDay.setHours(23, 59, 59, 999)
    return endOfDay
  }

  /**
   * Format datetime to readable string
   */
  formatDateTime(date: Date): string {
    return date.toLocaleString('id-ID', {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Format time only
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString('id-ID', {
      timeZone: this.TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Format date only
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Check if datetime is today
   */
  async isToday(date: Date): Promise<boolean> {
    const startOfToday = await this.getStartOfToday()
    const endOfToday = await this.getEndOfToday()
    return date >= startOfToday && date <= endOfToday
  }
}

// Export singleton instance
export default new WorldTimeService()
