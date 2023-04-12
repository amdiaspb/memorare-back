import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { deleteDeck, getDeck, getDeckSnapshot, getPublicDecks, getUserDecks, patchDeck, postDeck, putUpdateSnapshot } from "@/controllers";
import { patchDeckSchema } from "@/schemas/decks-schemas";

const decksRouter = Router();

decksRouter
  .all("/*", authenticateToken)

  .post("/", postDeck)
  .get("/", getPublicDecks)
  .get("/user", getUserDecks)
  .get("/:deckId", getDeck)
  .patch("/:deckId", validateBody(patchDeckSchema), patchDeck)
  .delete("/:deckId", deleteDeck)

  .get("/snapshot/:deckSnapshotId", getDeckSnapshot)
  .put("/:deckId/snapshot", putUpdateSnapshot)


export { decksRouter };
