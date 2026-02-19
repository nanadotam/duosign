export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isGuest: boolean;
  guestTranslationsRemaining: number;
}
