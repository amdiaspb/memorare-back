import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { patchCardSchema, postCardSchema } from "@/schemas/cards-schemas";
import { deleteCard, getCard, getCardsStatusFromDeck, patchCard, postCard } from "@/controllers";

const cardsRouter = Router();

cardsRouter
  .all("/*", authenticateToken)

  .post("/", validateBody(postCardSchema), postCard)
  .get("/:cardId", getCard)
  .get("/deck/:deckId", getCardsStatusFromDeck)
  .patch("/:cardId", validateBody(patchCardSchema), patchCard)
  .delete("/:cardId", deleteCard)
  
export { cardsRouter };
