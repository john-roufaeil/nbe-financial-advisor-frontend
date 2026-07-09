export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refresh_token: string;
}
