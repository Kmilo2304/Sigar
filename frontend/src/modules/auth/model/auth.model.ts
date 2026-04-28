export interface LoginFormModel {
  cedula: string
  password: string
}

export interface AuthUserModel {
  id: number
  cedula: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface LoginResponseModel {
  access_token: string
  token_type: string
  user: AuthUserModel
}
