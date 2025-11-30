import vine from '@vinejs/vine'

/**
 * Validator for creating a new holiday
 */
export const createHolidayValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(200),
    date: vine.date(),
    type: vine.enum(['national', 'religious', 'company', 'other']),
    is_recurring: vine.boolean().optional(),
    description: vine.string().trim().maxLength(500).optional()
  })
)

/**
 * Validator for updating an existing holiday
 */
export const updateHolidayValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(200).optional(),
    date: vine.date().optional(),
    type: vine.enum(['national', 'religious', 'company', 'other']).optional(),
    is_recurring: vine.boolean().optional(),
    description: vine.string().trim().maxLength(500).optional()
  })
)
