import type { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import { getSdk } from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"

import { createRequester } from "./lib/requester"
import {
  expectError,
  expectMatch,
} from "./utils/test-asserts"
import {
  createTestMatch,
  createTestResume,
  createTestResumes,
  createTestUser,
  createTestVacancies,
  loginTestUser,
} from "./utils/test-data"

describe("Matches (e2e)", () => {
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
    await app.close()
  })

  describe("Mutation", () => {
    describe("createMatch", () => {
      describe("throw error", () => {
        it("when user is not owner of a vacancy nor a resume", async () => {
          const {
            vacancies: [vacancy],
          } = await createTestVacancies()
          const {
            resumes: [notOwnedResume],
          } = await createTestResumes()

          const { resume: ownedResume } =
            await createTestResume()
          const { token } = await loginTestUser({
            app,
            user: ownedResume.author,
          })

          await expectError({
            exec: () =>
              getSdk(
                createRequester(app, { token })
              ).CreateMatch({
                input: {
                  resumeId: notOwnedResume.id,
                  vacancyId: vacancy.id,
                },
              }),
            message: "not found",
          })
        })

        it("when this match already exist", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.sender,
          })

          await expectError({
            exec: () =>
              getSdk(
                createRequester(app, { token })
              ).CreateMatch({
                input: {
                  resumeId: match.resume.id,
                  vacancyId: match.vacancy.id,
                },
              }),
            message: "already exist",
          })
        })
      })

      describe("create and return match", () => {
        it("when resume connects to vacancy with correct ownership", async () => {
          const {
            vacancies: [vacancy],
          } = await createTestVacancies()
          const {
            resumes: [resume],
          } = await createTestResumes()

          const { token } = await loginTestUser({
            app,
            user: resume.author,
          })

          const {
            createMatch: { match },
          } = await getSdk(
            createRequester(app, { token })
          ).CreateMatch({
            input: {
              resumeId: resume.id,
              vacancyId: vacancy.id,
            },
          })

          expectMatch({
            actual: match,
            expected: {
              receiver: vacancy.author,
              receiverId: vacancy.author.id,
              resume,
              resumeId: resume.id,
              sender: resume.author,
              senderId: resume.author.id,
              status: "PENDING",
              vacancy,
              vacancyId: vacancy.id,
            },
          })
        })

        it("when vacancy connected to resume with correct ownership", async () => {
          const {
            vacancies: [vacancy],
          } = await createTestVacancies()
          const {
            resumes: [resume],
          } = await createTestResumes()

          const { token } = await loginTestUser({
            app,
            user: vacancy.author,
          })

          const {
            createMatch: { match },
          } = await getSdk(
            createRequester(app, { token })
          ).CreateMatch({
            input: {
              resumeId: resume.id,
              vacancyId: vacancy.id,
            },
          })

          expectMatch({
            actual: match,
            expected: {
              receiver: resume.author,
              receiverId: resume.author.id,
              resume,
              resumeId: resume.id,
              sender: vacancy.author,
              senderId: vacancy.author.id,
              status: "PENDING",
              vacancy,
              vacancyId: vacancy.id,
            },
          })
        })
      })
    })

    describe("updateMatch", () => {
      describe("throw error", () => {
        it("when user is not part of the match", async () => {
          const { match } = await createTestMatch()
          const { user } = await createTestUser()

          const { token } = await loginTestUser({
            app,
            user,
          })

          await expectError({
            exec: () =>
              getSdk(
                createRequester(app, { token })
              ).UpdateMatch({
                input: {
                  id: match.id,
                  status: "ACCEPTED",
                },
              }),
            message: "User is not part of this match",
          })
        })

        it("when receiver tries to set status other than ACCEPTED or REJECTED", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.receiver,
          })

          await expectError({
            exec: () =>
              getSdk(
                createRequester(app, { token })
              ).UpdateMatch({
                input: {
                  id: match.id,
                  status: "CANCELED",
                },
              }),
            message: "Only the sender can cancel the match",
          })
        })

        it("when sender tries to set status to CANCELED", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.sender,
          })

          await expectError({
            exec: () =>
              getSdk(
                createRequester(app, { token })
              ).UpdateMatch({
                input: {
                  id: match.id,
                  status: "ACCEPTED",
                },
              }),
            message:
              "Only the receiver can accept or reject the match",
          })
        })

        it("when trying to set status to PENDING", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.receiver,
          })

          await expectError({
            exec: () =>
              getSdk(
                createRequester(app, { token })
              ).UpdateMatch({
                input: {
                  id: match.id,
                  status: "PENDING",
                },
              }),
            message:
              "The status 'PENDING' cannot be set explicitly",
          })
        })
      })

      describe("update and return match", () => {
        it("when receiver updates status to ACCEPTED", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.receiver,
          })

          const {
            updateMatch: { match: updatedMatch },
          } = await getSdk(
            createRequester(app, { token })
          ).UpdateMatch({
            input: { id: match.id, status: "ACCEPTED" },
          })

          expectMatch({
            actual: updatedMatch,
            expected: {
              ...match,
              status: "ACCEPTED",
              updatedAt: undefined,
            },
          })
        })

        it("when receiver updates status to REJECTED", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.receiver,
          })

          const {
            updateMatch: { match: updatedMatch },
          } = await getSdk(
            createRequester(app, { token })
          ).UpdateMatch({
            input: { id: match.id, status: "REJECTED" },
          })

          expectMatch({
            actual: updatedMatch,
            expected: {
              ...match,
              status: "REJECTED",
              updatedAt: undefined,
            },
          })
        })

        it("when sender cancels the match", async () => {
          const { match } = await createTestMatch()
          const { token } = await loginTestUser({
            app,
            user: match.sender,
          })

          const {
            updateMatch: { match: updatedMatch },
          } = await getSdk(
            createRequester(app, { token })
          ).UpdateMatch({
            input: { id: match.id, status: "CANCELED" },
          })

          expectMatch({
            actual: updatedMatch,
            expected: {
              ...match,
              status: "CANCELED",
            },
          })
        })
      })
    })
  })
})
