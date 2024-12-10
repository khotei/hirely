import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import { getSdk, type User } from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"

import { createRequester } from "./lib/requester"
import { expectSession } from "./utils/test-asserts"
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

  afterEach(async () => await prismaService.cleanTables())

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
      await expect(
        getSdk(createRequester(app)).Login({
          input: { email: "not-existed@email.com" },
        })
      ).rejects.toThrow(/user not found/iu)
    })
  })

  describe("Query", () => {
    let token: string
    let user: User

    beforeEach(async () => {
      const register = await registerTestUser({ app })

      ;({ token, user } = register)
    })

    describe("auth", () => {
      it("return authenticated user", async () => {
        const { session } = await getSdk(
          createRequester(app, { token })
        ).Session()

        expectSession({
          actual: session,
          expected: {
            user,
          },
        })
      })

      it("throw error when token is not provided", async () => {
        await expect(
          getSdk(createRequester(app)).Session()
        ).rejects.toThrow(/unauthorized/iu)
      })
    })
  })
})
