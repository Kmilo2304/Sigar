export interface UserModel {
  id: number
  cedula: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface UserCreateModel {
  cedula: string
  full_name: string
  password: string
  role: string
}

export interface UserRoleUpdateModel {
  role: string
}

export interface UserPasswordResetModel {
  password: string
}

export interface UsersSessionUserModel {
  full_name: string
}
