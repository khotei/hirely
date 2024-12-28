import type { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import {
  getSdk,
  type SessionFragment,
} from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"
import { PAGE_SIZE } from "@/web/common/lib/pagination"

import { createRequester } from "./lib/requester"
import {
  expectError,
  expectMatch,
} from "./utils/test-asserts"
import {
  createTestMatch,
  createTestMatches,
  createTestResume,
  createTestResumes,
  createTestUser,
  createTestVacancies,
  loginTestUser,
  registerTestUser,
} from "./utils/test-data"

describe("Matches (e2e)", () => {
  let app: INestApplication
  let prismaService: PrismaService

  let testSession: SessionFragment

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()

    app = moduleFixture.createNestApplication()

    prismaService = app.get(PrismaService)

    await app.init()
  })

  beforeEach(async () => {
    testSession = await registerTestUser({ app })
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

  describe("Query", () => {
    describe("matches", () => {
      it("returns only matches involving the user", async () => {
        const { matches: unrelatedMatches } =
          await createTestMatches()
        const { matches: userRelatedMatches } =
          await createTestMatches({
            count: 5,
            sender: testSession.user,
          })

        const {
          matches: {
            matches,
            pagination: { nextPage, page },
          },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Matches()

        expect(matches).not.toEqual(
          expect.arrayContaining(unrelatedMatches)
        )

        expect(matches).toHaveLength(5)
        expect(
          matches.map((match) => match.id)
        ).toMatchObject(
          expect.arrayContaining(
            userRelatedMatches.map((match) => match.id)
          )
        )

        expect(page).toEqual(1)
        expect(nextPage).toBeNull()
      })

      it("returns valid pagination", async () => {
        await createTestMatches({
          count: PAGE_SIZE + 3,
          sender: testSession.user,
        })

        const {
          matches: {
            matches: firstPageMatches,
            pagination: firstPagePagination,
          },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Matches()

        expect(firstPageMatches).toHaveLength(PAGE_SIZE)
        expect(firstPagePagination.page).toEqual(1)
        expect(firstPagePagination.nextPage).toEqual(2)

        const {
          matches: {
            matches: secondPageMatches,
            pagination: secondPagePagination,
          },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Matches({
          input: {
            pagination: {
              page: firstPagePagination.nextPage,
            },
          },
        })

        expect(secondPageMatches).toHaveLength(3)
        expect(secondPagePagination.page).toEqual(
          firstPagePagination.nextPage
        )
        expect(secondPagePagination.nextPage).toEqual(null)
      })
    })
  })
})
