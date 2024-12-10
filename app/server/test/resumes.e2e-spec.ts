import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import {
  getSdk,
  SessionFragment,
} from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"

import { createRequester } from "./lib/requester"
import {
  expectError,
  expectResume,
} from "./utils/test-asserts"
import {
  createCreateResumeInput,
  createTestResume,
  createTestResumes,
  registerTestUser,
} from "./utils/test-data"

describe("Resumes (e2e)", () => {
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

  afterEach(async () => await prismaService.cleanTables())

  beforeEach(async () => {
    testSession = await registerTestUser({ app })
  })

  describe("Unauthorized", () => {
    const fns = [
      {
        exec: () =>
          getSdk(createRequester(app)).CreateResume({
            input: createCreateResumeInput(),
          }),
        label: "createResume",
      },
      {
        exec: () =>
          getSdk(createRequester(app)).UpdateResume({
            input: { id: "fake-id" },
          }),
        label: "updateResume",
      },
      {
        exec: () =>
          getSdk(createRequester(app)).DeleteResume({
            input: { id: "fake-id" },
          }),
        label: "deleteResume",
      },
      {
        exec: () =>
          getSdk(createRequester(app)).Resume({
            input: { id: "fake-id" },
          }),
        label: "resume",
      },
      {
        exec: () => getSdk(createRequester(app)).Resumes(),
        label: "resumes",
      },
    ]

    fns.forEach(({ exec, label }) => {
      it(`throw error when ${label} unauthorized`, async () => {
        await expectError({
          exec,
          message: "unauthorized",
        })
      })
    })
  })

  describe("Mutation", () => {
    describe("createResume", () => {
      it("create and return resume", async () => {
        const createResumeInput = createCreateResumeInput()

        const {
          createResume: { resume },
        } = await getSdk(
          createRequester(app, { token: testSession.token })
        ).CreateResume({ input: createResumeInput })

        expectResume({
          actual: resume,
          author: testSession.user,
          expected: createResumeInput,
        })
      })
    })

    describe("updateResume", () => {
      it("throw error when resume does not exist", async () => {
        const createResumeInput = createCreateResumeInput()

        await expectError({
          exec: () =>
            getSdk(
              createRequester(app, {
                token: testSession.token,
              })
            ).UpdateResume({
              input: {
                id: "not-existed",
                ...createResumeInput,
              },
            }),
          message: "not found",
        })
      })

      it("throw error when resume does not belong to an user", async () => {
        const {
          resume: { id: anotherUserResumeId },
        } = await createTestResume()

        await expectError({
          exec: () =>
            getSdk(
              createRequester(app, {
                token: testSession.token,
              })
            ).UpdateResume({
              input: {
                id: anotherUserResumeId,
                ...createCreateResumeInput(),
              },
            }),
          message: "not found",
        })
      })

      it("update and return resume", async () => {
        const {
          resume: { id },
        } = await createTestResume({
          author: testSession.user,
        })

        const updateResumeInput = createCreateResumeInput()

        const {
          updateResume: { resume },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).UpdateResume({
          input: {
            id,
            ...updateResumeInput,
          },
        })

        expectResume({
          actual: resume,
          author: testSession.user,
          expected: {
            ...updateResumeInput,
            id,
          },
        })
      })
    })

    describe("deleteResume", () => {
      it("throw error when resume does not exist", async () => {
        await expectError({
          exec: () =>
            getSdk(
              createRequester(app, {
                token: testSession.token,
              })
            ).DeleteResume({
              input: {
                id: "not-existed",
              },
            }),
          message: "not found",
        })
      })

      it("throw error when resume does not belong to an user", async () => {
        const {
          resume: { id: anotherUserResumeId },
        } = await createTestResume()

        await expectError({
          exec: () =>
            getSdk(
              createRequester(app, {
                token: testSession.token,
              })
            ).DeleteResume({
              input: {
                id: anotherUserResumeId,
              },
            }),
          message: "not found",
        })
      })

      it("delete and return resume", async () => {
        const { resume } = await createTestResume({
          author: testSession.user,
        })

        const {
          deleteResume: { resume: deletedResume },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).DeleteResume({
          input: {
            id: resume.id,
          },
        })

        expectResume({
          actual: resume,
          expected: deletedResume,
        })
      })
    })
  })

  describe("Query", () => {
    describe("resume", () => {
      it("throw error when resume does not exist", async () => {
        await expectError({
          exec: () =>
            getSdk(
              createRequester(app, {
                token: testSession.token,
              })
            ).Resume({
              input: {
                id: "not-existed",
              },
            }),
          message: "not found",
        })
      })

      it("throw error when resume does not belong to an user", async () => {
        const {
          resume: { id: anotherUserResumeId },
        } = await createTestResume()

        await expectError({
          exec: () =>
            getSdk(
              createRequester(app, {
                token: testSession.token,
              })
            ).Resume({
              input: {
                id: anotherUserResumeId,
              },
            }),
          message: "not found",
        })
      })

      it("find and return resume", async () => {
        const { resume } = await createTestResume({
          author: testSession.user,
        })

        const {
          resume: { resume: searchedResume },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Resume({
          input: {
            id: resume.id,
          },
        })

        expectResume({
          actual: resume,
          expected: searchedResume,
        })
      })
    })

    describe("resumes", () => {
      it("return only author's resumes", async () => {
        const { resumes: randomResumes } =
          await createTestResumes()
        const { resumes: userResumes } =
          await createTestResumes({
            author: testSession.user,
            count: 7,
          })

        const {
          resumes: { resumes },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Resumes()

        expect(resumes).not.toEqual(
          expect.arrayContaining(randomResumes)
        )

        expect(resumes).toHaveLength(7)
        expect(resumes).toEqual(
          expect.arrayContaining(userResumes)
        )
      })
    })
  })
})
