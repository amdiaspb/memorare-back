import express, { json } from "express";
import cors from "cors";
import { handleApplicationErrors } from "@/middlewares";
import { db } from "@/configs"; // DELETE IT
import { usersRouter, authRouter, workshopRouter } from "@/routers";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { Card, Study } from "./protocols";
import httpStatus from "http-status";
import { shuffle } from "./utils/helper";

const app = express();
app
  .use(cors())
  .use(json())
  .get("/health", (_req, res) => res.send("OK!"))
  .use("/users", usersRouter)
  .use("/login", authRouter)
  .use("/workshop", workshopRouter)


  // DECKS ============================================


  .post("/decks", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const user = await db.rquery(`
      SELECT name FROM "user" WHERE id=$1;
    `, [session.user_id]);

    const deckCount = await db.rquery(`
      SELECT COUNT(id) FROM "deck" WHERE user_id=$1;
    `, [session.user_id]);

    const initialName = `(${user.name}) Deck #${+deckCount.count + 1}`;
    const defaultReadme = "";
    const firstCard = {
      front: "This is the front of your flashcard.",
      back: "And this is the back :D"
    }

    const snapshot = await db.rquery(`
      INSERT INTO "deck_snapshot" (name, readme, cards)
      VALUES ($1, $2, $3) RETURNING id;
    `, [initialName, defaultReadme, JSON.stringify([firstCard])]);
    
    const deck = await db.rquery(`
      INSERT INTO "deck" (name, readme, user_id, deck_snapshot_id)
      VALUES ($1, $2, $3, $4) RETURNING id, name;
    `, [initialName, defaultReadme, session.user_id, snapshot.id]);

    await db.rquery(`
      INSERT INTO "card" (name, front, back, deck_id)
      VALUES ('', $1, $2, $3);
    `, [firstCard.front, firstCard.back, deck.id]);

    res.status(httpStatus.CREATED).send(deck);
  })

  .get("/decks", async(req, res) => {
    const query = await db.query(`
      SELECT d.*, u.name AS "author"
      FROM "deck" AS d
      JOIN "user" AS u ON u.id = d.user_id
      WHERE d.visibility=true
      ORDER BY updated_at DESC;
    `);

    res.send(query.rows);
  })

  .get("/decks/user", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const decks = await db.query(`
      SELECT * FROM "deck" WHERE user_id=$1 ORDER BY updated_at DESC
    `, [session.user_id]);

    res.send(decks.rows);
  })


  .get("/decks/:deckId", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const deckId = +req.params.deckId;
    const deck = await db.rquery(`
      SELECT * FROM "deck" WHERE id=$1 AND user_id=$2
    `, [deckId, session.user_id]);
    if (!deck) return res.sendStatus(400);

    res.send(deck);
  })

  .patch("/decks/:deckId", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    // SCHEMA

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const deckId = +req.params.deckId;
    const deck = await db.rquery(`
      SELECT name, readme, visibility FROM "deck" WHERE id=$1 AND user_id=$2;
    `, [deckId, session.user_id]);
    if (!deck) return res.sendStatus(400);

    if (req.body.name !== deck.name && req.body.name?.includes(") Deck #")) return res.sendStatus(400);
    const name = req.body.name || deck.name;
    const readme = req.body.readme || deck.readme;
    const visibility = req.body.visibility !== undefined ? req.body.visibility : deck.visibility;

    await db.rquery(`
      UPDATE "deck" SET name=$1, readme=$2, visibility=$3 WHERE id=$4;
    `, [name, readme, visibility, deckId]);

    res.sendStatus(httpStatus.OK);
  })

  .delete("/decks/:deckId", async (req, res) => { //(-?deck_snapshot, -deckTag, -?tag, -cards)
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const deckId = +req.params.deckId;
    const deck = await db.rquery(`
      SELECT deck_snapshot_id FROM "deck" WHERE id=$1 AND user_id=$2;
    `, [deckId, session.user_id]);
    if (!deck) return res.sendStatus(400);

    await db.query(`
      DELETE FROM "deck_tag" WHERE deck_id=$1;
    `, [deckId]);

    await db.query(`
      DELETE FROM "card" WHERE deck_id=$1;
    `, [deckId]);

    await db.query(`
      DELETE FROM "deck" WHERE id=$1;
    `, [deckId]);

    const studiesDeckSnapshot = await db.rquery(`
      SELECT id FROM "study" WHERE deck_snapshot_id=$1;
    `, [deck.deck_snapshot_id]);
    if (!studiesDeckSnapshot) {
      await db.rquery(`
        DELETE FROM "deck_snapshot" WHERE id=$1;
      `, [deck.deck_snapshot_id]);
    }

    res.sendStatus(httpStatus.NO_CONTENT);
  })


  .put("/decks/:deckId/snapshot", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const deckId = +req.params.deckId;
    const deck = await db.rquery(`
      SELECT name, readme, visibility, deck_snapshot_id 
      FROM "deck" WHERE id=$1 AND user_id=$2;
    `, [deckId, session.user_id]);
    if (!deck) return res.sendStatus(400);

    // > TODO: UPDATE deck_tag

    await db.rquery(`
      UPDATE "card" SET altered=false WHERE deck_id=$1;
    `, [deckId]);

    const cards = await db.query(`
      SELECT front, back FROM "card" WHERE deck_id=$1;
    `, [deckId]);
    const cardsJson = JSON.stringify(cards.rows);

    const studiesDeckSnapshot = await db.rquery(`
      SELECT id FROM "study" WHERE deck_snapshot_id=$1;
    `, [deck.deck_snapshot_id]);

    if (studiesDeckSnapshot) {
      const deckSnapshot = await db.rquery(`
        INSERT INTO "deck_snapshot" (name, readme, visibility, cards)
        VALUES ($1, $2, $3, $4) RETURNING id;
      `, [deck.name, deck.readme, deck.visibility, cardsJson]);

      await db.rquery(`
        UPDATE "deck" SET deck_snapshot_id=$1, updated_at=$2 WHERE id=$3;
      `, [deckSnapshot.id, dayjs(), deckId]);
    } else {

      await db.rquery(`
        UPDATE "deck" SET updated_at=$1 WHERE id=$2;
      `, [dayjs(), deckId]);

      await db.rquery(`
        UPDATE "deck_snapshot" SET name=$1, readme=$2, visibility=$3, cards=$4, updated_at=$5 WHERE id=$6;
      `, [deck.name, deck.readme, deck.visibility, cardsJson, dayjs(), deck.deck_snapshot_id]);
    }

    res.sendStatus(httpStatus.OK);
  })

  .get("/decks/snapshot/:deckSnapshotId", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const deckSnapshotId = +req.params.deckSnapshotId;
    const deckSnapshot = await db.rquery(`
      SELECT * FROM "deck_snapshot" WHERE id=$1
    `, [deckSnapshotId]);

    res.send(deckSnapshot);
  })

  // STUDY ===========================================

  .get("/studies", async(req, res) => { // formated for listing
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const query = await db.query(`
      SELECT stu.id, snap.name, stu.cards_limit, stu.reviews_limit,
      stu_ses.id AS "studySessionId", stu_ses.state, snap.updated_at
      FROM "study" AS stu
      JOIN "session" AS ses ON stu.user_id = ses.user_id
      JOIN "deck_snapshot" AS snap ON stu.deck_snapshot_id = snap.id
      LEFT JOIN "study_session" AS stu_ses ON stu_ses.study_id = stu.id
      WHERE ses.token = $1
      ORDER BY snap.updated_at DESC
    `, [token]);

    const today = dayjs().format("DD/MM/YYYY"); // FIX
    for (let i = 0; i < query.rows.length; i++) {
      const study = query.rows[i];
      study.state = JSON.parse(study.state);
      const state = study.state;

      const { studySessionId, cards_limit, reviews_limit } = study;
      delete study.studySessionId;
      delete study.cards_limit;
      delete study.reviews_limit;

      if (!study.state) break;
      if (state.date >= today) break;

      state.date = today;
      state.today[0] = Math.min(cards_limit, state.total[0]);
      state.today[1] = state.total[1];
      state.today[2] = Math.min(reviews_limit, state.total[2]);
      await db.rquery(`
        UPDATE "study_session" SET state=$1 WHERE id=$2;
      `, [JSON.stringify(state), studySessionId]);
    };

    res.send(query.rows);
  })

  .get("/studies/:study_id/info", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const study_id = req.params.study_id;
    const info = await db.rquery(`
      SELECT s.*, sse.state, dss.name FROM study s
      JOIN study_session sse ON sse.study_id = s.id
      JOIN deck_snapshot dss ON s.deck_snapshot_id = dss.id
      WHERE s.id=$1;
    `, [study_id]);

    res.send(info);
  })

  .post("/studies", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);

    const { snapshotId } = req.body;

    let study = await db.rquery(`
      SELECT * FROM "study" WHERE user_id=$1 AND deck_snapshot_id=$2;
    `, [session.user_id, snapshotId]);

    if (study) return res.send("OK!");
    
    study = await db.rquery(`
      INSERT INTO "study" (user_id, deck_snapshot_id)
      VALUES ($1, $2)
      RETURNING *;
    `, [session.user_id, snapshotId]);

    res.send(study);
  })


  .get("/studies/:studyId/session", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const studyId = +req.params.studyId;
    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;
    if (!study) return res.sendStatus(400);

    const studySession = await db.rquery(`
      SELECT id, state, content, study_id FROM "study_session" WHERE study_id=$1;
    `, [study.id]);
    if (!studySession) return res.sendStatus(400);

    const { hard_interval, good_interval, easy_interval, cards_limit, reviews_limit } = study;
    const intervals = [hard_interval, good_interval, easy_interval];
    const options = { cards_limit, reviews_limit };
    const deckSnapshotId = study.deck_snapshot_id;

    res.send({ ...studySession, intervals, options, deckSnapshotId });
  })

  .post("/studies/:studyId/session", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const studyId = +req.params.studyId;
    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;
    if (!study) return res.sendStatus(400);

    let studySession = await db.rquery(`
      SELECT id, state, content, study_id FROM "study_session" WHERE study_id=$1;
    `, [study.id]);
    if (studySession) return res.sendStatus(400);

    const deckSnapshot = await db.rquery(`
      SELECT cards FROM "deck_snapshot" WHERE id=$1;
    `, [study.deck_snapshot_id]);
    const cards = JSON.parse(deckSnapshot.cards);

    const state = {
      date: dayjs().format("DD/MM/YYYY"),
      total: [cards.length, 0, 0],
      today: [Math.min(study.cards_limit, cards.length), 0, 0]
    }
    
    const content = {
      cards: [...cards.keys()],
      study: new Array(),
      review: new Array()
    }

    studySession = await db.rquery(`
      INSERT INTO "study_session" (state, content, study_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [state, content, study.id]);

    res.send(studySession);
  })

  .patch("/studies/:studyId/session", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];
    
    const session = await db.rquery(`
    SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    
    // SCHEMA CHECK
    
    const studyId = +req.params.studyId;
    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;
    
    if (!study) return res.send("DEU RUIM! PATCH STUDY SESSION");

    const data = req.body;
    await db.rquery(`
      UPDATE "study_session" SET state=$1, content=$2 WHERE study_id=$3;
    `, [data.state, data.content, study.id]);

    res.sendStatus(200);
  })


  .patch("/studies/:studyId", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    // SCHEMA

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const studyId = +req.params.studyId;
    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]);
    if (!study) return res.sendStatus(400);

    const hard_interval = req.body.hardInterval || study.hard_interval;
    const good_interval = req.body.goodInterval || study.good_interval;
    const easy_interval = req.body.easyInterval || study.easy_interval;
    const cards_limit = req.body.cardsLimit || study.cards_limit;
    const reviews_limit = req.body.reviewsLimit || study.reviews_limit;
    const cards_random = req.body.cardsRandom !== undefined ? req.body.cardsRandom : study.cards_random;
    const reviews_random = req.body.reviewsRandom !== undefined ? req.body.reviewsRandom : study.reviews_random;

    if (cards_random !== study.cards_random) {
      const studySession = await db.rquery(`
        SELECT content FROM "study_session" WHERE study_id=$1;
      `, [studyId]);
      const content = JSON.parse(studySession.content);

      if (cards_random) shuffle(content.cards);
      else content.cards.sort((a: number, b: number) => a - b);

      await db.rquery(`
        UPDATE "study_session" SET content=$1 WHERE study_id=$2;
      `, [JSON.stringify(content), studyId]);
    }

    await db.rquery(`
      UPDATE "study"
      SET hard_interval=$1, good_interval=$2, easy_interval=$3,
      cards_limit=$4, cards_random=$5, reviews_limit=$6, reviews_random=$7
      WHERE id=$8;
    `, [hard_interval, good_interval, easy_interval, cards_limit,
       cards_random, reviews_limit, reviews_random, studyId]);

    res.sendStatus(httpStatus.OK);
  })

  .delete("/studies/:studyId", async (req, res) => { // (-?deck_snapshot, -study_session)
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const studyId = +req.params.studyId;
    const study = await db.rquery(` 
      SELECT deck_snapshot_id FROM "study" WHERE id=$1;
    `, [studyId]);
    if (!study) return res.sendStatus(400);

    const studiesDeckSnapshot = await db.rquery(`
      SELECT id FROM "study" WHERE deck_snapshot_id=$1 AND id NOT IN ($2);
    `, [study.deck_snapshot_id, studyId]);

    const deckSnapshot = await db.rquery(`
      SELECT id FROM "deck" WHERE deck_snapshot_id=$1;
    `, [study.deck_snapshot_id]);
    
    await db.query(`
      DELETE FROM "study_session" WHERE study_id=$1;
    `, [studyId]);

    await db.query(`
      DELETE FROM "study" WHERE id=$1;
    `, [studyId]);

    if (!studiesDeckSnapshot && !deckSnapshot) {
      await db.rquery(`
        DELETE FROM "deck_snapshot" WHERE id=$1;
      `, [study.deck_snapshot_id]);
    }

    res.sendStatus(httpStatus.NO_CONTENT);
  })
  

  // CARDS =========================================


  .get("/cards/deck/:deckId", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const deckId = +req.params.deckId;
    const deck = await db.rquery(`
      SELECT id FROM "deck" WHERE user_id=$1
    `, [session.user_id]);
    if (!deck) return res.sendStatus(400);

    const cards = await db.query(`
      SELECT id, altered FROM "card" WHERE deck_id=$1 ORDER BY created_at ASC;
    `, [deckId]);
    if (!cards) return res.sendStatus(400);

    res.send(cards.rows);
  })

  .get("/cards/:cardId", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const cardId = +req.params.cardId;
    const card = await db.rquery(`
      SELECT * FROM "card" WHERE id=$1
    `, [cardId]);
    if (!card) return res.sendStatus(400);

    const deck = await db.rquery(`
      SELECT * FROM "deck" WHERE id=$1 AND user_id=$2;
    `, [card.deck_id, session.user_id]);
    if (!deck) return res.sendStatus(400);

    res.send(card);
  })

  .delete("/cards/:cardId", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const cardId = +req.params.cardId;
    const card = await db.rquery(`
      SELECT * FROM "card" WHERE id=$1
    `, [cardId]);
    if (!card) return res.sendStatus(400);

    const deck = await db.rquery(`
      SELECT * FROM "deck" WHERE id=$1 AND user_id=$2;
    `, [card.deck_id, session.user_id]);
    if (!deck) return res.sendStatus(400);

    await db.rquery(`
      DELETE FROM "card" WHERE id=$1;
    `, [cardId]);
    res.sendStatus(httpStatus.OK);
  })

  .post("/cards", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const { deckId } = req.body;
    const deck = await db.rquery(`
      SELECT * FROM "deck" WHERE id=$1;
    `, [deckId]);
    if (!deck) return res.sendStatus(400);

    const card = await db.rquery(`
      INSERT INTO "card" (name, front, back, deck_id)
      VALUES ('', '', '', $1) RETURNING *;
    `, [deckId]);
    res.status(httpStatus.CREATED).send(card);
  })

  .patch("/cards/:cardId", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];
    
    const session = await db.rquery(`
    SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);
    
    const cardId = +req.params.cardId;
    const card = await db.rquery(`
    SELECT deck_id FROM "card" WHERE id=$1;
    `, [cardId]);
    if (!card) return res.sendStatus(400);
    
    const deck = await db.rquery(`
    SELECT id FROM "deck" WHERE id=$1;
    `, [card.deck_id]);
    if (!deck) return res.sendStatus(400);

    await db.rquery(`
      UPDATE "card" SET front=$1, back=$2, altered=true WHERE id=$3;
    `, [req.body.front, req.body.back, cardId]);

    res.send("PATCHED!");
  })


  // ===============================================

  
  .get("/test", async (_req, res) => { // DELETE IT
    //SELECT * FROM "session"
    //INSERT INTO "deck" (name, readme, visibility, user_id) VALUES ('One', 'Wazap', 'private', 8) RETURNING *
    
    await db.rquery(`
      UPDATE "deck" SET created_at=$1 WHERE id=4;
    `, [dayjs().toISOString()]);

    await db.rquery(`
      UPDATE "deck" SET created_at=$1 WHERE id=3;
    `, [dayjs().toISOString()]);

    const query = await db.query(`
      SELECT created_at FROM "deck";
    `);

    const obj = query.rows.map(d => new Date(d.created_at).toLocaleString());

    res.send(obj);
  })
  .use(handleApplicationErrors);

export { app };
