import { faker } from "@faker-js/faker"
import type { INestApplication } from "@nestjs/common"
import {
  PrismaClient,
  type User,
  UserRole,
} from "@prisma/client"

import {
  type CreateResumeInput,
  getSdk,
  type RegisterInput,
  type SessionFragment,
} from "@/__generated__/schema"

import { createRequester } from "../lib/requester"

// auth

export const createRegisterInput = (
  override: Partial<RegisterInput> = {}
): RegisterInput => {
  return {
    email: faker.internet.email(),
    role: faker.helpers.enumValue(UserRole),
    ...override,
  }
}

export const registerTestUser = async ({
  app,
}: {
  app: INestApplication
}): Promise<SessionFragment> => {
  const registerInput = createRegisterInput()

  const { register } = await getSdk(
    createRequester(app)
  ).Register({
    input: registerInput,
  })

  return register
}

// resumes

export const createCreateResumeInput = (
  override: Partial<CreateResumeInput> = {}
): CreateResumeInput => {
  return {
    description: faker.person.bio(),
    salary: parseFloat(faker.finance.amount()),
    title: faker.lorem.paragraphs({ max: 5, min: 2 }),
    ...override,
  }
}

export const createTestResume = async ({
  author,
  override,
}: {
  author?: User
  override?: Partial<CreateResumeInput>
} = {}) => {
  const createResumeInput: CreateResumeInput = {
    ...createCreateResumeInput(),
    ...override,
  }

  const prisma = new PrismaClient()

  const resume = await prisma.resume.create({
    data: {
      ...createResumeInput,
      author: {
        connect: {
          id:
            author?.id ??
            (
              await prisma.user.create({
                data: createRegisterInput(),
              })
            ).id,
        },
      },
    },
    include: { author: true },
  })

  return {
    resume,
  }
}

export const createTestResumes = async ({
  author,
  count,
  override,
}: {
  author?: User
  count?: number
  override?:
    | (() => Partial<CreateResumeInput>)
    | Partial<CreateResumeInput>
} = {}) => {
  return {
    resumes: await Promise.all(
      Array.from({ length: count ?? 5 }).map(() =>
        createTestResume({
          author,
          override:
            typeof override === "function"
              ? override()
              : override,
        })
      )
    ).then((res) => res.map(({ resume }) => resume)),
  }
}
