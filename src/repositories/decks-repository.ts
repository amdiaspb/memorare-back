import { db } from "@/configs";
import { Deck, DeckSnapshot } from "@/protocols";

// CREATE ========================================================================

function create(name: string, readme: string, userId: number, snapshotId: number): Promise<NewDeck> {
  const newDeck = db.rquery(`
    INSERT INTO "deck" (name, readme, user_id, deck_snapshot_id)
    VALUES ($1, $2, $3, $4) RETURNING id, name;
  `, [name, readme, userId, snapshotId]);

  return newDeck;
}

export type NewDeck = Pick<Deck, "id">;

function createSnapshot(name: string, readme: string, cards: string, visibility: boolean = false): Promise<NewSnapshot> {
  const newSnapshot = db.rquery(`
    INSERT INTO "deck_snapshot" (name, readme, cards, visibility)
    VALUES ($1, $2, $3, $4) RETURNING id;
  `, [name, readme, cards, visibility]);

  return newSnapshot;
}

type NewSnapshot = Pick<DeckSnapshot, "id">;

// FIND =========================================================================

function findByIdAndUserId(deckId: number, userId: number): Promise<Deck> {
  const deck = db.rquery(`
    SELECT * FROM "deck" WHERE id=$1 AND user_id=$2;
  `, [deckId, userId]);

  return deck;
}

function findManyPublic(): Promise<PublicDeck[]> {
  const publicDecks = db.rquerya(`
    SELECT d.id, d.name, d.updated_at, u.name AS "author"
    FROM "deck" AS d
    JOIN "user" AS u ON u.id = d.user_id
    WHERE d.visibility=true
    ORDER BY updated_at DESC;
  `);

  return publicDecks;
}

export type PublicDeck = Pick<Deck, "id" | "name" | "updated_at"> | { author: string };

function findManyByUserId(userId: number): Promise<Deck[]> {
  const decks = db.rquerya(`
    SELECT * FROM "deck" WHERE user_id=$1
    ORDER BY updated_at DESC
  `, [userId]);

  return decks;
}

function findById(deckId: number): Promise<Deck> {
  const deck = db.rquery(`
    SELECT * FROM "deck" WHERE id=$1;
  `, [deckId]);

  return deck;
}

function findDeckSnapshotById(deckSnapshotId: number): Promise<DeckSnapshot> {
  const deckSnapshot = db.rquery(`
    SELECT * FROM "deck_snapshot" WHERE id=$1;
  `, [deckSnapshotId]);

  return deckSnapshot;
}

function findManyBySnapshotId(deckSnapshotId: number): Promise<{ id: number }[]> {
  const decks = db.rquerya(`
    SELECT id FROM "deck" WHERE deck_snapshot_id=$1;
  `, [deckSnapshotId]);

  return decks;
}

// UPDATE =======================================================================

function update(name: string, readme: string, visibility: boolean, deckId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "deck" SET name=$1, readme=$2, visibility=$3, updated_at=NOW() WHERE id=$4;
  `, [name, readme, visibility, deckId]);

  return result;
}

function updateSnapshotId(snapshotId: number, deckId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "deck" SET deck_snapshot_id=$1, updated_at=NOW() WHERE id=$2;
  `, [snapshotId, deckId]);

  return result;
}

function updateDate(deckId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "deck" SET updated_at=NOW() WHERE id=$1;
  `, [deckId]);

  return result;
}

function updateSnapshot(name: string, readme: string, visibility: boolean, cards: string, snapshotId: number): Promise<void> {
  const result = db.rquery(`
    UPDATE "deck_snapshot" SET name=$1, readme=$2, visibility=$3, cards=$4, updated_at=NOW() WHERE id=$5;
  `, [name, readme, visibility, cards, snapshotId]);

  return result;
}

// DELETE =======================================================================

function deleteManyDeckTagByDeckId(deckId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "deck_tag" WHERE deck_id=$1;
  `, [deckId]);

  return result;
}

function deleteById(deckId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "deck" WHERE id=$1;
  `, [deckId]);

  return result;
}

function deleteSnapshotById(snapshotId: number): Promise<void> {
  const result = db.rquery(`
    DELETE FROM "deck_snapshot" WHERE id=$1;
  `, [snapshotId]);

  return result;
}

// ==============================================================================

export type WorkshopSessionId = number;

export const decksRepository = {
  create,
  createSnapshot,
  findByIdAndUserId,
  findManyPublic,
  findManyByUserId,
  findById,
  findDeckSnapshotById,
  findManyBySnapshotId,
  update,
  updateSnapshotId,
  updateDate,
  updateSnapshot,
  deleteManyDeckTagByDeckId,
  deleteById,
  deleteSnapshotById
}
