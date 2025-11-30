import { IUser } from '#models/user'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    user?: IUser
  }
}

declare module '@adonisjs/core/http' {
  export interface Request {
    user?: IUser
  }
}
