import { type INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import {
  getSdk,
  type SessionFragment,
} from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"

import { createRequester } from "./lib/requester"
import {
  expectError,
  expectSession,
} from "./utils/test-asserts"
import {
  createRegisterInput,
  registerTestUser,
} from "./utils/test-data"

describe("AuthResolver (e2e)", () => {
  let app: INestApplication
  let prismaService: PrismaService

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()

    app = moduleFixture.createNestApplication()

    prismaService = app.get(PrismaService)

    await app.init()
  })

  afterEach(async () => {
    await prismaService.cleanTables()
    await prismaService.$disconnect()
  })

  describe("Mutation", () => {
    describe("register", () => {
      it("create and return user", async () => {
        const registerInput = createRegisterInput()

        const { register } = await getSdk(
          createRequester(app)
        ).Register({
          input: registerInput,
        })

        expectSession({
          actual: register,
          expected: {
            user: registerInput,
          },
        })
      })
    })
  })

  describe("login", () => {
    it("find and return user", async () => {
      const { user } = await registerTestUser({ app })

      const { login } = await getSdk(
        createRequester(app)
      ).Login({
        input: { email: user.email },
      })

      expectSession({
        actual: login,
        expected: {
          user,
        },
      })
    })

    it("throw error when user not found", async () => {
      await expectError({
        exec: () =>
          getSdk(createRequester(app)).Login({
            input: { email: "not-existed@email.com" },
          }),
        message: "not found",
      })
    })
  })

  describe("Query", () => {
    let testSession: SessionFragment

    beforeEach(async () => {
      testSession = await registerTestUser({ app })
    })

    describe("auth", () => {
      it("return authenticated user", async () => {
        const { session } = await getSdk(
          createRequester(app, { token: testSession.token })
        ).Session()

        expectSession({
          actual: session,
          expected: {
            user: testSession.user,
          },
        })
      })

      it("throw error when token is not provided", async () => {
        await expectError({
          exec: () =>
            getSdk(createRequester(app)).Session(),
          message: "unauthorized",
        })
      })
    })
  })
})
