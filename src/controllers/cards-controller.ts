import { AuthenticatedRequest } from "@/middlewares";
import { cardsService } from "@/services";
import { Response } from "express";
import httpStatus from "http-status";

// POST =======================================================================

export async function postCard(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { deckId } = req.body;

  try {
    const newCard = await cardsService.createCard(deckId, userId);
    return res.status(httpStatus.CREATED).send(newCard);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}


// GET ========================================================================

export async function getCard(req: AuthenticatedRequest, res: Response) {
  const cardId = +req.params.cardId;

  try {
    const card = await cardsService.findCard(cardId);
    return res.send(card);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function getCardsStatusFromDeck(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const deckId = +req.params.deckId;

  try {
    const cardsStatus = await cardsService.findCardsStatus(deckId, userId);
    return res.send(cardsStatus);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// UPDATE =====================================================================

export async function patchCard(req: AuthenticatedRequest, res: Response) {
  const { userId, body } = req;
  const cardId = +req.params.cardId;

  try {
    await cardsService.updateCard(cardId, userId, body);
    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// DELETE =====================================================================

export async function deleteCard(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const cardId = +req.params.cardId;

  try {
    await cardsService.deleteCardById(cardId, userId);
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}
