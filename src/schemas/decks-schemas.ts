import { Deck } from "@/protocols";
import joi from "joi";

export const patchDeckSchema = joi.object<PatchDeckData>({
  name: joi.string().required(),
  readme: joi.string().allow('').required(),
  visibility: joi.boolean().required()
});

export type PatchDeckData = Pick<Deck, "name" | "readme" | "visibility">;
