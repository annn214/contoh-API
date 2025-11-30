import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IHoliday extends Document {
  name: string
  date: Date
  type: 'national' | 'religious' | 'company' | 'other'
  is_recurring: boolean
  description?: string
  created_by: Types.ObjectId
  created_at: Date
  updated_at: Date
}

const holidaySchema = new Schema<IHoliday>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['national', 'religious', 'company', 'other'],
    default: 'company',
    required: true
  },
  is_recurring: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Index for efficient date range queries
holidaySchema.index({ date: 1, type: 1 })

// Prevent duplicate holidays on the same date
holidaySchema.index({ date: 1, name: 1 }, { unique: true })

const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema)

export default Holiday
