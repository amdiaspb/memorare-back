// MAIN ==================================================================

export type ApplicationError = {
  name: string;
  message: string;
};

// DATABASE ==============================================================

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export type Session = {
  id: number;
  user_id: number;
  token: string;
  created_at: Date;
  updated_at: Date;
}

// =========================================================================
