import { app } from "@/app";
import { dbConnect, dbDisconnect, envLoad } from "@/configs";
import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import { createUser } from "../factories";
import { cleanDb } from "../helpers";

beforeAll(async () => {
  envLoad();
  await dbConnect();
});

afterAll(() => {
  dbDisconnect();
})

beforeEach(async () => {
  await cleanDb();
})

const server = supertest(app);

describe("POST /users", () => {
  it("should respond with status 400 when body is not given", async () => {
    const response = await server.post("/users");
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  it("should respond with status 400 when body is not valid", async () => {
    const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
    const response = await server.post("/users").send(invalidBody);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  describe("when body is valid", () => {
    const generateValidBody = () => ({
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(6),
    });

    it("should respond with status 409 when name already exists", async () => {
      const body = generateValidBody();
      await createUser(body);

      const response = await server.post("/users").send(body);

      expect(response.status).toBe(httpStatus.CONFLICT);
    });

    it("should respond with status 409 when email already exists", async () => {
      const body = generateValidBody();
      await createUser(body);
      body.name = "abc";

      const response = await server.post("/users").send(body);

      expect(response.status).toBe(httpStatus.CONFLICT);
    });

    it("should not return user password on body", async () => {
      const body = generateValidBody();

      const response = await server.post("/users").send(body);

      expect(response.body).not.toHaveProperty("password");
    });
  });
});
