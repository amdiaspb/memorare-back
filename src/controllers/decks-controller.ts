import { AuthenticatedRequest } from "@/middlewares";
import { decksService } from "@/services";
import { Response } from "express";
import httpStatus from "http-status";

// POST =======================================================================

export async function postDeck(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const newDeck = await decksService.createDeck(userId);
    return res.status(httpStatus.CREATED).send(newDeck);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// GET ========================================================================

export async function getPublicDecks(req: AuthenticatedRequest, res: Response) {
  try {
    const publicDecks = await decksService.findPublicDecks();
    return res.send(publicDecks);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function getUserDecks(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const userDecks = await decksService.findUserDecks(userId);
    return res.send(userDecks);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function getDeck(req: AuthenticatedRequest, res: Response) {
  const deckId = +req.params.deckId;

  try {
    const deck = await decksService.findDeckById(deckId);
    return res.send(deck);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function getDeckSnapshot(req: AuthenticatedRequest, res: Response) {
  const deckSnapshotId = +req.params.deckSnapshotId;

  try {
    const deckSnapshot = await decksService.findDeckSnapshot(deckSnapshotId);
    return res.send(deckSnapshot);
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// UPDATE =====================================================================

export async function patchDeck(req: AuthenticatedRequest, res: Response) {
  const { userId, body } = req;
  const deckId = +req.params.deckId;

  try {
    await decksService.updateDeck(deckId, userId, body);
    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

export async function putUpdateSnapshot(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const deckId = +req.params.deckId;

  try {
    await decksService.updateSnapshot(deckId, userId);
    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}

// DELETE =====================================================================

export async function deleteDeck(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const deckId = +req.params.deckId;

  try {
    await decksService.deleteDeck(deckId, userId);
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.status(httpStatus.UNAUTHORIZED).send(error);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error);
  }
}
