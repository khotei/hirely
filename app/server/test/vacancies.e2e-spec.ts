import { type INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import {
  getSdk,
  type SessionFragment,
  type VacancyFragment,
} from "@/__generated__/schema"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/common/services/prisma.service"
import { PAGE_SIZE } from "@/web/common/lib/pagination"

import { createRequester } from "./lib/requester"
import {
  expectError,
  expectVacancy,
} from "./utils/test-asserts"
import {
  createCreateVacancyInput,
  createTestVacancies,
  createTestVacancy,
  registerTestUser,
} from "./utils/test-data"

describe("Vacancies (e2e)", () => {
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
    describe("unauthorized", () => {
      const mutations = [
        {
          label: "createVacancy",
          mutation: () =>
            getSdk(createRequester(app)).CreateVacancy({
              input: createCreateVacancyInput(),
            }),
        },
        {
          label: "updateVacancy",
          mutation: () =>
            getSdk(createRequester(app)).UpdateVacancy({
              input: { id: "fake-id" },
            }),
        },
        {
          label: "deleteVacancy",
          mutation: () =>
            getSdk(createRequester(app)).DeleteVacancy({
              input: { id: "fake-id" },
            }),
        },
        {
          label: "resume",
          mutation: () =>
            getSdk(createRequester(app)).Vacancy({
              input: { id: "fake-id" },
            }),
        },
        {
          label: "vacancies",
          mutation: () =>
            getSdk(createRequester(app)).Vacancies(),
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

    describe("createVacancy", () => {
      it("create and return resume", async () => {
        const createVacancyInput =
          createCreateVacancyInput()

        const {
          createVacancy: { vacancy },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).CreateVacancy({ input: createVacancyInput })

        expectVacancy({
          actual: vacancy,
          author: testSession.user,
          expected: createVacancyInput,
        })
      })
    })

    describe("updateVacancy", () => {
      describe("not found", () => {
        const createVacancyInput =
          createCreateVacancyInput()
        let randomVacancy: VacancyFragment

        beforeEach(async () => {
          const { vacancy } = await createTestVacancy()
          randomVacancy = vacancy
        })

        const mutations = [
          {
            label: "does not exist",
            mutation: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).UpdateVacancy({
                input: {
                  id: "not-existed",
                  ...createVacancyInput,
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
              ).UpdateVacancy({
                input: {
                  id: randomVacancy.id,
                  ...createVacancyInput,
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

      it("update and return vacancy", async () => {
        const {
          vacancy: { id },
        } = await createTestVacancy({
          author: testSession.user,
        })

        const updateVacancyInput =
          createCreateVacancyInput()

        const {
          updateVacancy: { vacancy },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).UpdateVacancy({
          input: {
            id,
            ...updateVacancyInput,
          },
        })

        expectVacancy({
          actual: vacancy,
          author: testSession.user,
          expected: {
            ...updateVacancyInput,
            id,
          },
        })
      })
    })

    describe("deleteVacancy", () => {
      describe("not found", () => {
        let randomVacancy: VacancyFragment

        beforeEach(async () => {
          const { vacancy } = await createTestVacancy()
          randomVacancy = vacancy
        })

        const mutations = [
          {
            label: "does not exist",
            mutation: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).DeleteVacancy({
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
              ).DeleteVacancy({
                input: {
                  id: randomVacancy.id,
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
        const { vacancy } = await createTestVacancy({
          author: testSession.user,
        })

        const {
          deleteVacancy: { vacancy: deletedVacancy },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).DeleteVacancy({
          input: {
            id: vacancy.id,
          },
        })

        expectVacancy({
          actual: vacancy,
          expected: deletedVacancy,
        })
      })
    })
  })

  describe("Query", () => {
    describe("vacancy", () => {
      describe("not found", () => {
        let randomVacancy: VacancyFragment

        beforeEach(async () => {
          const { vacancy } = await createTestVacancy()
          randomVacancy = vacancy
        })

        const queries = [
          {
            label: "does not exist",
            query: async () => {
              await getSdk(
                createRequester(app, {
                  token: testSession.token,
                })
              ).Vacancy({
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
              ).Vacancy({
                input: {
                  id: randomVacancy.id,
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

      it("find and return vacancy", async () => {
        const { vacancy } = await createTestVacancy({
          author: testSession.user,
        })

        const {
          vacancy: { vacancy: searchedVacancy },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Vacancy({
          input: {
            id: vacancy.id,
          },
        })

        expectVacancy({
          actual: vacancy,
          expected: searchedVacancy,
        })
      })
    })

    describe("vacancies", () => {
      it("return only author's vacancies", async () => {
        const { vacancies: randomVacancies } =
          await createTestVacancies()
        const { vacancies: userVacancies } =
          await createTestVacancies({
            author: testSession.user,
            count: 7,
          })

        const {
          vacancies: {
            pagination: { nextPage, page },
            vacancies,
          },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Vacancies()

        expect(vacancies).not.toEqual(
          expect.arrayContaining(randomVacancies)
        )

        expect(vacancies).toHaveLength(7)
        expect(vacancies).toEqual(
          expect.arrayContaining(userVacancies)
        )

        expect(page).toEqual(1)
        expect(nextPage).toBeNull()
      })

      it("returns valid pagination", async () => {
        await createTestVacancies({
          author: testSession.user,
          count: 12,
        })

        const {
          vacancies: {
            pagination: firstPagePagination,
            vacancies: firstPageVacancies,
          },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Vacancies()

        expect(firstPageVacancies).toHaveLength(PAGE_SIZE)
        expect(firstPagePagination.page).toEqual(1)
        expect(firstPagePagination.nextPage).toEqual(2)

        const {
          vacancies: { pagination: secondPagePagination },
        } = await getSdk(
          createRequester(app, {
            token: testSession.token,
          })
        ).Vacancies({
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
