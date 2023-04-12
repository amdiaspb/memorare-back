
import { Card } from "@/protocols";
import { badRequestError, unauthorizedError } from "@/errors";
import { decksRepository } from "@/repositories/decks-repository";
import { cardsRepository, CardStatus } from "@/repositories/cards-repository";
import { PatchCardData } from "@/schemas/cards-schemas";

// CREATE =======================================================================

async function createCard(deckId: number, userId: number): Promise<Card> {
  const deck = await decksRepository.findByIdAndUserId(deckId, userId);
  if (!deck) throw unauthorizedError();

  return cardsRepository.create(deckId);
}

// FIND =======================================================================

async function findCard(cardId: number): Promise<Card> {
  return cardsRepository.findById(cardId);
}

async function findCardsStatus(deckId: number, userId: number): Promise<CardStatus[]> {
  const deck = await decksRepository.findByIdAndUserId(deckId, userId);
  if (!deck) throw unauthorizedError();

  return cardsRepository.findManyStatusByDeckId(deckId);
}

// UPDATE =====================================================================

async function updateCard(cardId: number, userId: number, data: PatchCardData): Promise<void> {
  const card = await cardsRepository.findById(cardId);
  if (!card) throw badRequestError();

  const deck = await decksRepository.findByIdAndUserId(card.deck_id, userId);
  if (!deck) throw unauthorizedError();

  return cardsRepository.update(data.front, data.back, cardId);
}

// DELETE =====================================================================

async function deleteCardById(cardId: number, userId: number): Promise<void> {
  const card = await cardsRepository.findById(cardId);
  if (!card) throw badRequestError();

  const deck = await decksRepository.findByIdAndUserId(card.deck_id, userId);
  if (!deck) throw unauthorizedError();

  await cardsRepository.deleteById(cardId);
}

// ==============================================================================

export const cardsService = {
  createCard,
  findCard,
  findCardsStatus,
  updateCard,
  deleteCardById
}
