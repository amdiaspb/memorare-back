
import { Deck, DeckSnapshot } from "@/protocols";
import { badRequestError, unauthorizedError } from "@/errors";
import { decksRepository, NewDeck, PublicDeck } from "@/repositories/decks-repository";
import { cardsRepository } from "@/repositories/cards-repository";
import { userRepository } from "@/repositories";
import { PatchDeckData } from "@/schemas/decks-schemas";
import { studiesRepository } from "@/repositories/studies-repository";

// CREATE =======================================================================

async function createDeck(userId: number): Promise<NewDeck> {
  const user = await userRepository.findById(userId);

  const deckCount = user.deck_count + 1;
  const initialName = `(${user.name}) Deck #${deckCount}`;
  const defaultReadme = "";
  const firstCard = {
    front: "This is the front of your flashcard.",
    back: "And this is the back :D"
  }

  // user: update deck count
  await userRepository.updateDeckCountById(deckCount, userId);

  // deck: create initial snapshot
  const cardsJsonString = JSON.stringify([firstCard]);
  const newSnapshot = await decksRepository.createSnapshot(initialName, defaultReadme, cardsJsonString);
  
  // deck: create deck
  const newDeck = await decksRepository.create(initialName, defaultReadme, userId, newSnapshot.id);

  // card: create first card
  await cardsRepository.create(newDeck.id);

  return newDeck;
}

// FIND =======================================================================

async function findPublicDecks(): Promise<PublicDeck[]> {
  return decksRepository.findManyPublic();
}

async function findUserDecks(userId: number): Promise<PublicDeck[]> {
  return decksRepository.findManyByUserId(userId);
}

async function findDeckById(deckId: number): Promise<Deck> {
  return decksRepository.findById(deckId);
}

async function findDeckSnapshot(deckSnapshotId: number): Promise<DeckSnapshot> {
  return decksRepository.findDeckSnapshotById(deckSnapshotId);
}

// UPDATE =====================================================================

async function updateDeck(deckId: number, userId: number, data: PatchDeckData): Promise<void> {
  const deck = await decksRepository.findByIdAndUserId(deckId, userId);
  if (!deck) throw unauthorizedError();

  const isChangingName = (data.name !== deck.name);
  const includesInvalidSubstring = data.name.includes(") Deck #");
  if (isChangingName && includesInvalidSubstring) throw badRequestError;

  return decksRepository.update(data.name, data.readme, data.visibility, deckId);
}

async function updateSnapshot(deckId: number, userId: number): Promise<void> {
  const deck = await decksRepository.findByIdAndUserId(deckId, userId);
  if (!deck) throw unauthorizedError();

  await cardsRepository.updateManyStatusByDeckId(false, deckId);
  const cards = await cardsRepository.findManyByDeckId(deckId);
  const cardsJsonString = JSON.stringify(cards);

  const { name, readme, visibility: vis, deck_snapshot_id: snapshotId} = deck;
  const studiesDeckSnapshot = await studiesRepository.findManyByDeckSnapshotId(snapshotId);
  
  if (studiesDeckSnapshot) {
    const newSnapshot = await decksRepository.createSnapshot(name, readme, cardsJsonString, vis);
    await decksRepository.updateSnapshotId(newSnapshot.id, deckId);
  } else {
    await decksRepository.updateSnapshot(name, readme, vis, cardsJsonString, snapshotId);
    await decksRepository.updateDate(deckId);
  }
}

// DELETE =======================================================================

async function deleteDeck(deckId: number, userId: number): Promise<void> {
  const deck = await decksRepository.findByIdAndUserId(deckId, userId);
  if (!deck) throw unauthorizedError();

  await decksRepository.deleteManyDeckTagByDeckId(deckId);
  await cardsRepository.deleteManyByDeckId(deckId);
  await decksRepository.deleteById(deckId);

  const snapshotId = deck.deck_snapshot_id;
  const studiesDeckSnapshot = await studiesRepository.findManyByDeckSnapshotId(snapshotId);
  if (!studiesDeckSnapshot) await decksRepository.deleteSnapshotById(snapshotId);
}

// ==============================================================================

export const decksService = {
  createDeck,
  findPublicDecks,
  findUserDecks,
  findDeckById,
  findDeckSnapshot,
  updateDeck,
  updateSnapshot,
  deleteDeck
}
