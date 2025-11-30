/**
 * Database Seeder
 * Run this script to populate initial data for testing
 * 
 * Usage: node database/seed.js
 */

import mongoose from 'mongoose'
import User from '../app/models/user.js'
import Employee from '../app/models/employee.js'
import Attendance from '../app/models/attendance.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karyawan'

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)

    // Clear existing data
    await User.deleteMany({})
    await Employee.deleteMany({})
    await Attendance.deleteMany({})

    // Create admin user (via registration)
    const admin = new User({
      name: 'Admin System',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    })
    await admin.save()

    // Create sample employees (with auto-generated user accounts)
    
    const employeeData = [
      // Sample employees with positions
      {
        name: 'John Doe',
        position: 'Software Engineer',
        department: 'Engineering',
        salary: 75000,
        join_date: new Date('2023-01-15'),
        created_by: admin._id
      },
      {
        name: 'Jane Smith',
        position: 'Product Manager',
        department: 'Product',
        salary: 85000,
        join_date: new Date('2023-02-01'),
        created_by: admin._id
      },
      {
        name: 'Mike Johnson',
        position: 'UX Designer',
        department: 'Design',
        salary: 70000,
        join_date: new Date('2023-03-10'),
        created_by: admin._id
      },
      {
        name: 'Sarah Williams',
        position: 'Senior Developer',
        department: 'Engineering',
        salary: 95000,
        join_date: new Date('2022-11-05'),
        created_by: admin._id
      },
      {
        name: 'David Brown',
        position: 'DevOps Engineer',
        department: 'Engineering',
        salary: 80000,
        join_date: new Date('2023-04-20'),
        created_by: admin._id
      },
      {
        name: 'Emily Davis',
        position: 'Marketing Manager',
        department: 'Marketing',
        salary: 72000,
        join_date: new Date('2023-05-15'),
        created_by: admin._id
      },
      {
        name: 'Chris Wilson',
        position: 'QA Engineer',
        department: 'Engineering',
        salary: 65000,
        join_date: new Date('2023-06-01'),
        created_by: admin._id
      },
      {
        name: 'Lisa Anderson',
        position: 'HR Manager',
        department: 'Human Resources',
        salary: 70000,
        join_date: new Date('2022-12-01'),
        created_by: admin._id
      }
    ]

    // Create employees with user accounts
    const employeeCredentials = []
    for (const empData of employeeData) {
      // Generate email from name
      const email = empData.name.toLowerCase().replace(/\s+/g, '.') + '@company.com'
      const password = 'employee123' // Simple password for demo
      
      // Create user account for employee
      const employeeUser = new User({
        name: empData.name,
        email: email,
        password: password,
        role: 'user'
      })
      await employeeUser.save()
      
      // Create employee record linked to user
      const employee = new Employee({
        ...empData,
        user_id: employeeUser._id
      })
      await employee.save()
      
      employeeCredentials.push({ name: empData.name, email, password })
    }

    // Close connection
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run seeder
seed()
