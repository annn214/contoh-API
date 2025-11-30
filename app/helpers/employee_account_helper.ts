/**
 * Helper utilities for employee-user account management
 */

/**
 * Generate email from employee name
 * Example: "John Doe" -> "john.doe@company.com"
 */
export function generateEmailFromName(name: string, domain: string = 'company.com'): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/[^a-z0-9.]/g, '') // Remove special characters except dots
  
  return `${normalized}@${domain}`
}

/**
 * Generate secure random password
 * @param length - Password length (default: 12)
 * @returns Random alphanumeric password
 */
export function generatePassword(length: number = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let password = ''
  
  // Ensure at least one uppercase, one lowercase, and one number
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  
  password += upper[Math.floor(Math.random() * upper.length)]
  password += lower[Math.floor(Math.random() * lower.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Generate username from name
 * Example: "John Doe" -> "john.doe"
 */
export function generateUsernameFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
}
