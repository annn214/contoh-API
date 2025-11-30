import vine from '@vinejs/vine'

export const createEmployeeValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    position: vine.string().trim().minLength(2).maxLength(100),
    department: vine.string().trim().minLength(2).maxLength(100),
    salary: vine.number().min(0).max(999999999),
    join_date: vine.date().optional(),
    email: vine.string().email().optional() // Custom email for employee account (auto-generated if not provided)
  })
)

export const updateEmployeeValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).optional(),
    position: vine.string().trim().minLength(2).maxLength(100).optional(),
    department: vine.string().trim().minLength(2).maxLength(100).optional(),
    salary: vine.number().min(0).max(999999999).optional(),
    join_date: vine.date().optional()
  })
)
