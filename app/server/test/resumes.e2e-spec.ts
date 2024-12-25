import { type INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import {
  getSdk,
  type ResumeFragment,
  type SessionFragment,
} from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"
import { PAGE_SIZE } from "@/web/common/lib/pagination"

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

  afterEach(async () => {
    await prismaService.cleanTables()
    await prismaService.$disconnect()
    await app.close()
  })

  beforeEach(async () => {
    testSession = await registerTestUser({ app })
  })

  describe("Mutation", () => {
    describe("unauthorized", () => {
      const mutations = [
        {
          label: "createResume",
          mutation: () =>
            getSdk(createRequester(app)).CreateResume({
              input: createCreateResumeInput(),
            }),
        },
        {
          label: "updateResume",
          mutation: () =>
            getSdk(createRequester(app)).UpdateResume({
              input: { id: "fake-id" },
            }),
        },
        {
          label: "deleteResume",
          mutation: () =>
            getSdk(createRequester(app)).DeleteResume({
              input: { id: "fake-id" },
            }),
        },
        {
          label: "resume",
          mutation: () =>
            getSdk(createRequester(app)).Resume({
              input: { id: "fake-id" },
            }),
        },
        {
          label: "resumes",
          mutation: () =>
            getSdk(createRequester(app)).Resumes(),
        },
      ]

      mutations.forEach(({ label, mutation }) => {
        it(`throw error when ${label} unauthorized`, async () => {
          await expectError({
            exec: mutation,
            message: "unauthorized",
          })
        })
      })
    })

    describe("createResume", () => {
      it("create and return resume", async () => {
        const createResumeInput = createCreateResumeInput()

        const {
          createResume: { resume },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).CreateResume({ input: createResumeInput })

        expectResume({
          actual: resume,
          author: testSession.user,
          expected: createResumeInput,
        })
      })
    })

    describe("updateResume", () => {
      describe("not found", () => {
        const createResumeInput = createCreateResumeInput()
        let randomResume: ResumeFragment

        beforeEach(async () => {
          const { resume } = await createTestResume()
          randomResume = resume
        })

        const mutations = [
          {
            label: "does not exist",
            mutation: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).UpdateResume({
                input: {
                  id: "not-existed",
                  ...createResumeInput,
                },
              })
            },
          },
          {
            label: "belongs to another user",
            mutation: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).UpdateResume({
                input: {
                  id: randomResume.id,
                  ...createResumeInput,
                },
              })
            },
          },
        ]

        mutations.forEach(({ label, mutation }) => {
          it(`throw error when resume ${label}`, async () => {
            await expectError({
              exec: mutation,
              message: "not found",
            })
          })
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
      describe("not found", () => {
        let randomResume: ResumeFragment

        beforeEach(async () => {
          const { resume } = await createTestResume()
          randomResume = resume
        })

        const mutations = [
          {
            label: "does not exist",
            mutation: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).DeleteResume({
                input: {
                  id: "not-existed",
                },
              })
            },
          },
          {
            label: "belongs to another user",
            mutation: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).DeleteResume({
                input: {
                  id: randomResume.id,
                },
              })
            },
          },
        ]

        mutations.forEach(({ label, mutation }) => {
          it(`throw error when resume ${label}`, async () => {
            await expectError({
              exec: mutation,
              message: "not found",
            })
          })
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
      describe("not found", () => {
        let randomResume: ResumeFragment

        beforeEach(async () => {
          const { resume } = await createTestResume()
          randomResume = resume
        })

        const queries = [
          {
            label: "does not exist",
            query: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).Resume({
                input: {
                  id: "not-existed",
                },
              })
            },
          },
          {
            label: "belongs to another user",
            query: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).Resume({
                input: {
                  id: randomResume.id,
                },
              })
            },
          },
        ]

        queries.forEach(({ label, query }) => {
          it(`throw error when resume ${label}`, async () => {
            await expectError({
              exec: query,
              message: "not found",
            })
          })
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
          resumes: {
            pagination: { nextPage, page },
            resumes,
          },
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

        expect(page).toEqual(1)
        expect(nextPage).toBeNull()
      })

      it("returns valid pagination", async () => {
        await createTestResumes({
          author: testSession.user,
          count: 12,
        })

        const {
          resumes: {
            pagination: firstPagePagination,
            resumes: firstPageResumes,
          },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Resumes()

        expect(firstPageResumes).toHaveLength(PAGE_SIZE)
        expect(firstPagePagination.page).toEqual(1)
        expect(firstPagePagination.nextPage).toEqual(2)

        const {
          resumes: { pagination: secondPagePagination },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Resumes({
          input: {
            pagination: {
              page: firstPagePagination.nextPage,
            },
          },
        })

        expect(secondPagePagination.page).toEqual(
          firstPagePagination.nextPage
        )
        expect(secondPagePagination.nextPage).toEqual(null)
      })
    })
  })
})
