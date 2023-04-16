import { Card } from "@/protocols";
import joi from "joi";

export const postCardSchema = joi.object({
  deckId: joi.number().required()
});

export const patchCardSchema = joi.object<PatchCardData>({
  front: joi.string().allow('').required(),
  back: joi.string().allow('').required()
});

export type PatchCardData = Pick<Card, "front" | "back">;
