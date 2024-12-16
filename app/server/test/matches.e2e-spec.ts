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

  afterEach(async () => await prismaService.cleanTables())

  describe("Mutation", () => {
    describe("createMatch", () => {
      it("throw error when user has not vacancy nor a resume", async () => {
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

      it("throw error when this match already exist", async () => {
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

      it("create and return match when resume to vacancy with correct ownership", async () => {
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

      it("create and return match when vacancy to resume with correct ownership", async () => {
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
})
