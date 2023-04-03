/* import { WorkshopSessionState } from "@/services";
import joi from "joi";

export const upsertWorkshopSessionSchema = joi.object({
  deckId: joi.number().required(),
  stateObj: joi.object({
    currentType: joi.string().valid("readme", "cards").required(),
    readme: joi.string().required(),
    cards: joi.object({
      currentIndex: joi.number().required(),
      stack: joi.object().pattern(/^/, joi.string()).required()
    }).required()
  }).required()
});

export type UpsertWorkshopSessionParams = {
  deckId: number,
  stateObj: WorkshopSessionState
}
 */