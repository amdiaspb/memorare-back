import { Deck, DeckSnapshot, Study, StudySession, StudySessionState } from "@/protocols";
import { badRequestError, conflictError, unauthorizedError } from "@/errors";
import { decksRepository, PublicDeck } from "@/repositories/decks-repository";
import { cardsRepository } from "@/repositories/cards-repository";
import { userRepository } from "@/repositories";
import { FormatedStudy, studiesRepository, StudyInfo } from "@/repositories/studies-repository";
import dayjs from "dayjs";
import { PatchStudyData, PatchStudySessionData } from "@/schemas";
import { shuffle } from "@/utils/helper";

// CREATE =======================================================================

async function createStudy(userId: number, snapshotId: number): Promise<CreateStudyReturn> {
  let study = await studiesRepository.findByDeckSnapshotId(snapshotId);
  if (study) throw conflictError();

  study = await studiesRepository.create(userId, snapshotId);
  const snapshot = await decksRepository.findDeckSnapshotById(snapshotId);
  const cards = JSON.parse(snapshot.cards);

  const state = JSON.stringify({
    date: dayjs().toISOString(),
    total: [cards.length, 0, 0],
    today: [Math.min(study.cards_limit, cards.length), 0, 0]
  });
  
  const content = JSON.stringify({
    cards: [...cards.keys()],
    study: new Array(),
    review: new Array()
  });

  const session = await studiesRepository.createSession(state, content, study.id);

  return {
    studyId: study.id,
    studySessionId: session.id
  };
}

type CreateStudyReturn = { studyId: number, studySessionId: number };

// FIND =========================================================================

async function findFormatedStudies(userId: number): Promise<FormatedStudy[]> {
  const formatedStudies = await studiesRepository.findManyFormatedStudies(userId);

  const today = dayjs();
  for (let i = 0; i < formatedStudies.length; i++) {
    const study = formatedStudies[i];
    const { studySessionId, cards_limit, reviews_limit } = study;
    delete study.studySessionId;
    delete study.cards_limit;
    delete study.reviews_limit;

    if (!study.state) break;

    const state = JSON.parse(study.state) as StudySessionState;
    if (dayjs(state.date).isAfter(today, "day")) break;

    state.date = today.toISOString();
    state.today[0] = Math.min(cards_limit, state.total[0]);
    state.today[1] = state.total[1];
    state.today[2] = Math.min(reviews_limit, state.total[2]);

    study.state = JSON.stringify(state);
    await studiesRepository.updateSessionState(study.state, studySessionId);
  };

  return formatedStudies;
}

async function findStudyInfo(studyId: number): Promise<StudyInfo> {
  return studiesRepository.findInfoById(studyId);
}

async function findFormatedStudySession(studyId: number): Promise<FormatedStudySession> {
  const study = await studiesRepository.findById(studyId);
  const session = await studiesRepository.findSessionByStudyId(studyId);

  const formatedObj = {
    ...session,
    deckSnapshotId: study.deck_snapshot_id,
    intervals: [study.hard_interval, study.good_interval, study.easy_interval],
    options: [study.cards_limit, study.reviews_limit]
  }

  return formatedObj;
}

type FormatedStudySession = StudySession & {
  deckSnapshotId: number,
  intervals: number[],
  options: number[]
}

// UPDATE =======================================================================

async function updateStudy(studyId: number, userId: number, data: PatchStudyData): Promise<void> {
  const study = await studiesRepository.findByIdAndUserId(studyId, userId);
  if (!study) throw unauthorizedError();

  if (data.cards_random !== study.cards_random) {
    const studySession = await studiesRepository.findSessionByStudyId(studyId);
    const content = JSON.parse(studySession.content);

    if (data.cards_random) shuffle(content.cards);
    else content.cards.sort((a: number, b: number) => a - b);

    await studiesRepository.updateSessionContent(JSON.stringify(content), studySession.id);
  }

  return studiesRepository.update(data, studyId);
}

async function updateStudySession(studyId: number, userId: number, data: PatchStudySessionData): Promise<void> {
  const study = await studiesRepository.findByIdAndUserId(studyId, userId);
  if (!study) throw unauthorizedError();

  return studiesRepository.updateSessionByStudyId(
    JSON.stringify(data.state), JSON.stringify(data.content), studyId
  );
}

// DELETE =======================================================================

async function deleteStudy(studyId: number, userId: number): Promise<void> {
  const study = await studiesRepository.findByIdAndUserId(studyId, userId);
  if (!study) throw unauthorizedError();

  await studiesRepository.deleteSessionByStudyId(study.id);
  await studiesRepository.deleteById(study.id);

  const snapshotId = study.deck_snapshot_id;
  const studies = await studiesRepository.findManyBySnapshotIdNotId(snapshotId, study.id);
  const decks = await decksRepository.findManyBySnapshotId(snapshotId);
  
  if (!studies && !decks) {
    await decksRepository.deleteSnapshotById(snapshotId);
  }
}

// ==============================================================================

export const studiesService = {
  createStudy,
  findFormatedStudies,
  findStudyInfo,
  findFormatedStudySession,
  updateStudy,
  updateStudySession,
  deleteStudy
}
