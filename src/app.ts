import express, { json } from "express";
import cors from "cors";
import { handleApplicationErrors } from "@/middlewares";
import { db } from "@/configs"; // DELETE IT
import { usersRouter, authRouter, workshopRouter } from "@/routers";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { Card, Study } from "./protocols";
import httpStatus from "http-status";

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

    const initialName = faker.random.numeric(12);
    const defaultReadme = "";
    const firstCard = {
      front: "This is the front of your flashcard.",
      back: "And this is the back :D."
    }

    const snapshot = await db.rquery(`
      INSERT INTO "deck_snapshot" (name, readme, cards)
      VALUES ($1, $2, $3) RETURNING id;
    `, [initialName, defaultReadme, [firstCard]]);
    
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

  .get("/decks/user", async(req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const query = await db.query(`
      SELECT d.* 
      FROM "deck" AS d
      JOIN "session" AS s
      ON d.user_id = s.user_id
      WHERE s.token = $1
    `, [token]);

    res.send(query.rows);
  })

  .get("/decks", async(req, res) => {
    const query = await db.query(`
      SELECT * FROM "deck";
    `);

    res.send(query.rows);
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

    const name = req.body.name || deck.name;
    const readme = req.body.readme || deck.readme;
    const visibility = req.body.visibility || deck.visibility;

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

    const studiesDeckSnapshot = await db.rquery(`
      SELECT id FROM "study" WHERE deck_snapshot_id=$1;
    `, [deck.deck_snapshot_id]);
    if (!studiesDeckSnapshot) {
      await db.rquery(`
        DELETE FROM "deck_snapshot" WHERE id=$1;
      `, [deck.deck_snapshot_id]);
    }

    await db.query(`
      DELETE FROM "deck_tag" WHERE deck_id=$1;
      DELETE FROM "card" WHERE deck_id=$1;
      DELETE FROM "deck" WHERE id=$1;
    `, [deckId]);

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
      SELECT name, readme, visibility FROM "deck" WHERE id=$1 AND user_id=$2;
    `, [deckId, session.user_id]);
    if (!deck) return res.sendStatus(400);

    const cards = await db.rquery(`
      SELECT front, back FROM "card" WHERE deck_id=$1;
    `, [deckId]);

    await db.rquery(`
      UPDATE "deck" SET name=$1, readme=$2, visibility=$3, cards=$4 WHERE id=$5;
    `, [deck.name, deck.readme, deck.visibility, cards, deckId]);

    res.sendStatus(httpStatus.OK);
  })


  // STUDY ===========================================


  .post("/study", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);

    const { snapshotId } = req.body;

    let study = await db.rquery(`
      SELECT * FROM "study" WHERE deck_snapshot_id=$1;
    `, [snapshotId]);

    if (study) return res.send("OK!");
    
    study = await db.rquery(`
      INSERT INTO "study" (user_id, deck_snapshot_id)
      VALUES ($1, $2)
      RETURNING *;
    `, [session.user_id, snapshotId]);

    res.send(study);
  })

  .patch("/study/:studyId", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    // SCHEMA

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    if (!session) return res.sendStatus(400);

    const studyId = +req.params.studyId;
    const study = await db.rquery(`
      SELECT id FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]);
    if (!study) return res.sendStatus(400);

    const hard_interval = req.body.hard_interval || study.hard_interval;
    const good_interval = req.body.good_interval || study.good_interval;
    const easy_interval = req.body.easy_interval || study.easy_interval;
    const cards_limit = req.body.cards_limit || study.cards_limit;
    const cards_random = req.body.cards_random || study.cards_random;
    const reviews_limit = req.body.reviews_limit || study.reviews_limit;
    const reviews_random = req.body.reviews_random || study.reviews_random;

    await db.rquery(`
      UPDATE "study"
      SET hard_interval=$1, good_interval=$2, easy_interval=$3
      cards_limit=$4, cards_random=$5, reviews_limit=$6, reviews_random=$7
      WHERE id=$8;
    `, [hard_interval, good_interval, easy_interval, cards_limit,
       cards_random, reviews_limit, reviews_random, studyId]);

    res.sendStatus(httpStatus.OK);
  })

  .get("/studies", async(req, res) => { // formated for listing
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const query = await db.query(`
      SELECT stu.id, snap.name AS name, stu.cards_limit, stu.reviews_limit, stu_ses.id AS "studySessionId", stu_ses.state
      FROM "study" AS stu
      JOIN "session" AS ses ON stu.user_id = ses.user_id
      JOIN "deck_snapshot" AS snap ON stu.deck_snapshot_id = snap.id
      LEFT JOIN "study_session" AS stu_ses ON stu_ses.study_id = stu.id
      WHERE ses.token = $1
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

  .post("/studies/session", async (req, res) => { // getsert
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];

    const session = await db.rquery(`
      SELECT * FROM "session" WHERE token=$1;
    `, [token]);

    const { studyId } = req.body;

    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;

    if (!study) return res.send("DEU RUIM! Study");

    let studySession = await db.rquery(`
      SELECT id, state, content, study_id FROM "study_session" WHERE study_id=$1;
    `, [study.id]);
    const { hard_interval, good_interval, easy_interval, cards_limit, reviews_limit } = study;
    const intervals = [hard_interval, good_interval, easy_interval];
    const options = { cards_limit, reviews_limit };
    if (studySession) return res.send({ ...studySession, intervals, options });

    // TODO: GET FROM SNAPSHOT (code bellow is getting all the cards from user not only from deck)
    const query = await db.query(`
      SELECT c.id
      FROM "card" AS c
      JOIN "deck" AS d
      ON c.deck_id = d.id
      WHERE d.user_id=$1;
    `, [session.user_id]);

    const cards = query.rows;
    const state = {
      date: dayjs().format("DD/MM/YYYY"),
      total: [cards.length, 0, 0],
      today: [Math.min(study.cards_limit, cards.length), 0, 0]
    }
    
    const content = {
      cards: cards.map((c, i) => i),
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

  .patch("/studies/session", async (req, res) => {
    const authHeader = req.header("Authorization");
    const token = authHeader.split(" ")[1];
    
    const session = await db.rquery(`
    SELECT * FROM "session" WHERE token=$1;
    `, [token]);
    
    // SCHEMA CHECK
    
    const { studyId } = req.body;
    const study = await db.rquery(`
      SELECT * FROM "study" WHERE id=$1 AND user_id=$2;
    `, [studyId, session.user_id]) as Study;
    
    if (!study) return res.send("DEU RUIM! PATCH STUDY SESSION");

    const { data } = req.body;
    await db.rquery(`
      UPDATE "study_session" SET state=$1, content=$2 WHERE study_id=$3;
    `, [data.state, data.content, study.id]);

    res.sendStatus(200);
  })

  .delete("/study/:studyId", async (req, res) => { // (-?deck_snapshot, -study_session)
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

    if (!studiesDeckSnapshot && !deckSnapshot) {
      await db.rquery(`
        DELETE FROM "deck_snapshot" WHERE id=$1;
      `, [study.deck_snapshot_id]);
    }
    
    await db.query(`
      DELETE FROM "study_session" WHERE study_id=$1;
      DELETE FROM "study" WHERE id=$1;
    `, [studyId]);

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
    const cards = await db.rquery(`
      SELECT id, altered FROM "card" WHERE deck_id=$1 AND user_id=$2
    `, [deckId, session.user_id]);
    if (!cards) return res.sendStatus(400);

    res.send(cards);
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

    await db.rquery(`
      INSERT INTO "card" (name, front, back)
      VALUES ('', '', '')
    `);
    res.send(httpStatus.CREATED);
  })

  .patch("/cards", async (req, res) => {
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

    const { card } = req.body;
    await db.rquery(`
      UPDATE "card" SET front=$1, back=$2 WHERE id=$3;
    `, [card.front, card.back, card.id]);
    res.send("PATCHED!");
  })


  // ===============================================

  
  .get("/test", async (_req, res) => { // DELETE IT
    //SELECT * FROM "session"
    //INSERT INTO "deck" (name, readme, visibility, user_id) VALUES ('One', 'Wazap', 'private', 8) RETURNING *
    const query = await db.rquery(`
      SELECT * FROM "workshop_session"
    `);
    res.send(query);
  })
  .use(handleApplicationErrors);

export { app };
