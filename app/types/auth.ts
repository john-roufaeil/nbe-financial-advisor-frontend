/**
 * The backend returns ONLY an access token in the body. The refresh token is set
 * as an httpOnly cookie the browser stores and sends automatically — it is never
 * readable by JavaScript, so there is nothing to type or store for it here.
 */
export interface AuthTokens {
  access_token: string;
  user_id: string;
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
