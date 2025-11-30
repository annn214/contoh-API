import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IAttendance extends Document {
  employee_id: Types.ObjectId
  date: Date
  check_in: Date
  check_out?: Date
  status: 'present' | 'late' | 'absent' | 'half-day'
  notes?: string
  late_duration: number 
  work_duration?: number 
  created_at: Date
  updated_at: Date
  calculateLateDuration(): void
  calculateWorkDuration(): void
}

const attendanceSchema = new Schema<IAttendance>({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  check_in: {
    type: Date,
    required: true
  },
  check_out: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'half-day'],
    default: 'present'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  late_duration: {
    type: Number,
    default: 0,
    min: 0
  },
  work_duration: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true })

attendanceSchema.methods.calculateWorkDuration = function() {
  if (this.check_in && this.check_out) {
    const durationMs = this.check_out.getTime() - this.check_in.getTime()
    this.work_duration = Math.floor(durationMs / (1000 * 60)) 
  }
}

attendanceSchema.methods.calculateLateDuration = function() {
  const checkInTime = new Date(this.check_in)
  
  const utcHour = checkInTime.getUTCHours()
  const utcMinute = checkInTime.getUTCMinutes()
  
  let witaHour = utcHour + 8
  let witaMinute = utcMinute
  
  if (witaHour >= 24) {
    witaHour = witaHour - 24
  }
  
  const checkInMinutes = witaHour * 60 + witaMinute
  const standardMinutes = 9 * 60 
  

  if (checkInMinutes > standardMinutes) {
    this.late_duration = checkInMinutes - standardMinutes
    this.status = 'late'
  } else {
    this.late_duration = 0
    this.status = 'present'
  }
}

attendanceSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('check_in')) {
    this.calculateLateDuration()
  }
  
  if (this.check_out && (this.isNew || this.isModified('check_out'))) {
    this.calculateWorkDuration()
  }
  
  next()
})

const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema)

export default Attendance
