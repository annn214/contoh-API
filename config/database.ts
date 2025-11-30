import env from '#start/env'
import mongoose from 'mongoose'

const databaseConfig = {
  connection: env.get('MONGODB_URI', 'mongodb://localhost:27017/karyawan'),
  
  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.connection)
      console.log('✅ MongoDB connected successfully')
    } catch (error) {
      console.error('❌ MongoDB connection error:', error)
      throw error
    }
  },

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect()
      console.log('MongoDB disconnected')
    } catch (error) {
      console.error('MongoDB disconnection error:', error)
    }
  }
}

export default databaseConfig
