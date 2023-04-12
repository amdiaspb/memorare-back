import { db } from "@/configs";
import { Card } from "@/protocols";

// CREATE ========================================================================

function create(deckId: number): Promise<Card> {
  const newCard = db.rquery(`
    INSERT INTO "card" (deck_id)
    VALUES ($1) RETURNING *;
  `, [deckId]);

  return newCard;
}

// FIND =========================================================================

function findById(cardId: number): Promise<Card> {
  const card = db.rquery(`
    SELECT * FROM "card" WHERE id=$1
  `, [cardId])

  return card;
}

function findManyStatusByDeckId(deckId: number): Promise<CardStatus[]> {
  const cardsStatus = db.rquerya(`
    SELECT id, altered FROM "card"
    WHERE deck_id=$1
    ORDER BY created_at ASC;
  `, [deckId]);

  return cardsStatus;
}

export type CardStatus = Pick<Card, "id" | "altered">;

function findManyByDeckId(deckId: number): Promise<Card[]> {
  const cards = db.rquerya(`
    SELECT * FROM "card" WHERE deck_id=$1 ORDER BY created_at;
  `, [deckId])

  return cards;
}

// UPDATE =======================================================================

function update(front: string, back: string, cardId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "card" SET front=$1, back=$2, altered=true, updated_at=NOW() WHERE id=$3;
  `, [front, back, cardId]);

  return result;
}

function updateManyStatusByDeckId(altered: boolean, deckId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "card" SET altered=$1, updated_at=NOW() WHERE deck_id=$2;
  `, [altered, deckId]);

  return result;
}

// DELETE =======================================================================

function deleteById(cardId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "card" WHERE id=$1;
  `, [cardId]);

  return result;
}

function deleteManyByDeckId(deckId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "card" WHERE deck_id=$1;
  `, [deckId]);

  return result;
}

// ==============================================================================

export const cardsRepository = {
  create,
  findById,
  findManyStatusByDeckId,
  findManyByDeckId,
  update,
  updateManyStatusByDeckId,
  deleteById,
  deleteManyByDeckId
}
