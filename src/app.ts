import express, { json } from "express";
import cors from "cors";
import { usersRouter, authRouter, decksRouter, studiesRouter, cardsRouter } from "@/routers";
import { handleApplicationErrors } from "@/middlewares";

const app = express();
app
  .use(cors())
  .use(json())
  .get("/health", (_req, res) => res.send("OK!"))
  .use("/users", usersRouter)
  .use("/login", authRouter)
  .use("/decks", decksRouter)
  .use("/studies", studiesRouter)
  .use("/cards", cardsRouter)
  .use(handleApplicationErrors);

export { app };
