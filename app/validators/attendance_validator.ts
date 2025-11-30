import vine from '@vinejs/vine'

export const checkInValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().maxLength(500).optional()
  })
)

export const checkOutValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().maxLength(500).optional()
  })
)

export const attendanceFilterValidator = vine.compile(
  vine.object({
    employee_id: vine.string().optional(),
    start_date: vine.date().optional(),
    end_date: vine.date().optional(),
    status: vine.enum(['present', 'late', 'absent', 'half-day']).optional(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional()
  })
)

export const adminAttendanceValidator = vine.compile(
  vine.object({
    employee_id: vine.string().trim(),
    date: vine.date(),
    check_in: vine.date(),
    check_out: vine.date().optional(),
    status: vine.enum(['present', 'late', 'absent', 'half-day']),
    notes: vine.string().trim().maxLength(500).optional()
  })
)
