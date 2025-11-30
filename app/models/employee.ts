import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IEmployee extends Document {
  name: string
  position: string
  department: string
  salary: number
  join_date: Date
  user_id?: Types.ObjectId
  created_by: Types.ObjectId
  created_at: Date
  updated_at: Date
}

const employeeSchema = new Schema<IEmployee>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  join_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    unique: true,
    sparse: true, // allows multiple null values
    index: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema)

export default Employee
