import { Study, StudySessionContent, StudySessionState } from "@/protocols";
import joi from "joi";

export const postStudySchema = joi.object({
  snapshotId: joi.number().required()
});

export const patchStudySchema = joi.object<PatchStudyData>({
  hard_interval: joi.number().required(),
  good_interval: joi.number().required(),
  easy_interval: joi.number().required(),
  cards_limit: joi.number().required(),
  reviews_limit: joi.number().required(),
  cards_random: joi.boolean().required(),
  reviews_random: joi.boolean().required()
});

export type PatchStudyData = Omit<Study, "id" | "user_id" | "deck_snapshot_id"> & {
  snapshotId: number
};

const contentCard = joi.object({
  index: joi.number().required(),
  interval: joi.number().required(),
  date: joi.date().required()
});

export const patchStudySessionSchema = joi.object<PatchStudySessionData>({
  state: joi.object({
    date: joi.date().required(),
    total: joi.array().items(joi.number()).required(),
    today: joi.array().items(joi.number()).required()
  }).required(),
  content: joi.object({
    cards: joi.array().items(joi.number()).required(),
    study: joi.array().items(contentCard).required(),
    review: joi.array().items(contentCard).required(),
  }).required(),
});

export type PatchStudySessionData = {
  state: StudySessionState,
  content: StudySessionContent
}
