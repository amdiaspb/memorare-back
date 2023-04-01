
import { WorkshopSession } from "@/protocols";
import { workshopRepository, WorkshopSessionId } from "@/repositories";
import { notFoundError, unauthorizedError } from "@/errors";

// FIND =======================================================================

async function findWorkshopSession(userId: number, deckId: number): Promise<WorkshopSession> {
  // find: workshop session
  const session = await workshopRepository.findUnique(deckId);
  if (!session) throw notFoundError();

  const notFromUser = (session.user_id !== userId);
  if (notFromUser) throw unauthorizedError();

  return session;
}

// UPSERT =======================================================================

async function upsertWorkshopSession(userId: number, deckId: number, stateObj: WorkshopSessionState): Promise<WorkshopSessionId> {
  // find: workshop session
  const session = await workshopRepository.findUnique(deckId);
  if (!session) {
    return await workshopRepository.create(userId, deckId, stateObj);
  }

  const notFromUser = (session.user_id !== userId);
  if (notFromUser) throw unauthorizedError();

  return await workshopRepository.update(stateObj, deckId);
}

export type WorkshopSessionState = {
  currentType: string;
  readme: string;
  cards: {
    currentIndex: number;
    stack: {
        [key: string]: string;
    };
  };
};

// ==============================================================================

export const workshopService = {
  findWorkshopSession,
  upsertWorkshopSession
}
