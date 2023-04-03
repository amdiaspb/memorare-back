// MAIN ===================================================================

export type ApplicationError = {
  name: string;
  message: string;
};

// DATABASE ===============================================================

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

export type Deck = {
  id: number;
  name: string;
  readme: string;
  user_id: number;
  deck_snapshot_id: number;
  visibility: string;
  created_at: Date;
  updated_at: Date;
}

export type DeckSnapshot = {
  id: number;
  name: string;
  readme: string;
  visibility: string;
  cards: string;
  created_at: Date;
  updated_at: Date;
}

export type DeckTag = {
  id: number;
  saved: boolean;
  tag_id: number;
  deck_id: number;
  created_at: Date;
  updated_at: Date;
}

export type Tag = {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export type Review = {
  id: number;
  positive: boolean;
  message: string;
  deck_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export type Card = {
  id: number;
  name: string;
  front: string;
  back: string;
  altered: boolean;
  deck_id: number;
  created_at: Date;
  updated_at: Date;
}

export type Study = {
  id: number;
  user_id: number;
  deck_snapshot_id: number;
  hard_interval: number;
  good_interval: number;
  easy_interval: number;
  cards_limit: number;
  cards_random: boolean;
  reviews_limit: number;
  reviews_random: boolean;
  created_at: Date;
  updated_at: Date;
}

export type StudySession = {
  id: number;
  state: string;
  content: string;
  study_id: number;
  created_at: Date;
  updated_at: Date;
}

// ========================================================================
