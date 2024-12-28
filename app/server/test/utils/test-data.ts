import { faker } from "@faker-js/faker"
import type { INestApplication } from "@nestjs/common"
import { Prisma, type User, UserRole } from "@prisma/client"

import {
  CreateMatchInput,
  type CreateResumeInput,
  type CreateVacancyInput,
  getSdk,
  type RegisterInput,
  type SessionFragment,
} from "@/__generated__/schema"

import { createRequester } from "../lib/requester"

import { testPrismaClient } from "./prisma-helper"

// user

export const createTestUser = async () => {
  const user = await testPrismaClient.user.create({
    data: {
      email: faker.internet.email(),
      role: faker.helpers.enumValue(UserRole),
    },
  })

  return { user }
}

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

export const loginTestUser = async ({
  app,
  user,
}: {
  app: INestApplication
  user?: User
}): Promise<SessionFragment> => {
  const { login } = await getSdk(
    createRequester(app)
  ).Login({
    input: {
      email:
        user?.email ?? (await createTestUser()).user.email,
    },
  })

  return login
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

  const resume = await testPrismaClient.resume.create({
    data: {
      ...createResumeInput,
      author: {
        connect: {
          id:
            author?.id ??
            (
              await testPrismaClient.user.create({
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

// vacancies

export const createCreateVacancyInput = (
  override: Partial<CreateVacancyInput> = {}
): CreateVacancyInput => {
  return {
    description: faker.person.bio(),
    salary: parseFloat(faker.finance.amount()),
    title: faker.lorem.paragraphs({ max: 5, min: 2 }),
    ...override,
  }
}

export const createTestVacancy = async ({
  author,
  override,
}: {
  author?: User
  override?: Partial<CreateVacancyInput>
} = {}) => {
  const createVacancyInput: CreateVacancyInput = {
    ...createCreateVacancyInput(),
    ...override,
  }

  const vacancy = await testPrismaClient.vacancy.create({
    data: {
      ...createVacancyInput,
      author: {
        connect: {
          id:
            author?.id ??
            (
              await testPrismaClient.user.create({
                data: createRegisterInput(),
              })
            ).id,
        },
      },
    },
    include: { author: true },
  })

  return {
    vacancy,
  }
}

export const createTestVacancies = async ({
  author,
  count,
  override,
}: {
  author?: User
  count?: number
  override?:
    | (() => Partial<CreateVacancyInput>)
    | Partial<CreateVacancyInput>
} = {}) => {
  return {
    vacancies: await Promise.all(
      Array.from({ length: count ?? 5 }).map(() =>
        createTestVacancy({
          author,
          override:
            typeof override === "function"
              ? override()
              : override,
        })
      )
    ).then((res) => res.map(({ vacancy }) => vacancy)),
  }
}

// matches

export const createTestMatch = async (
  input: Partial<Prisma.MatchCreateInput> = {}
) => {
  const { user: sender } = await createTestUser()
  const { vacancy } = await createTestVacancy({
    author: sender,
  })

  const { user: receiver } = await createTestUser()
  const { resume } = await createTestResume({
    author: receiver,
  })

  const match = await testPrismaClient.match.create({
    data: {
      ...input,
      receiver: {
        connect: {
          id: resume.author.id,
        },
      },
      resume: {
        connect: { id: resume.id },
      },
      sender: {
        connect: {
          id: vacancy.author.id,
        },
      },
      vacancy: {
        connect: { id: vacancy.id },
      },
    },
    include: {
      receiver: true,
      resume: {
        include: {
          author: true,
        },
      },
      sender: true,
      vacancy: {
        include: {
          author: true,
        },
      },
    },
  })

  return {
    match,
  }
}

export const createTestMatches = async ({
  count,
  override,
  receiver,
  sender,
}: {
  count?: number
  override?:
    | (() => Partial<Prisma.MatchCreateInput>)
    | Partial<Prisma.MatchCreateInput>
  receiver?: User
  sender?: User
} = {}) => {
  return {
    matches: await Promise.all(
      Array.from({ length: count ?? 5 }).map(async () => {
        const { user: defaultSender } =
          await createTestUser()
        const { vacancy } = await createTestVacancy({
          author: sender ?? defaultSender,
        })

        const { user: defaultReceiver } =
          await createTestUser()
        const { resume } = await createTestResume({
          author: receiver ?? defaultReceiver,
        })

        const matchData: Prisma.MatchCreateInput = {
          receiver: {
            connect: {
              id: resume.author.id,
            },
          },
          resume: {
            connect: { id: resume.id },
          },
          sender: {
            connect: {
              id: vacancy.author.id,
            },
          },
          vacancy: {
            connect: { id: vacancy.id },
          },
          ...(typeof override === "function"
            ? override()
            : override),
        }

        const match = await testPrismaClient.match.create({
          data: matchData,
          include: {
            receiver: true,
            resume: {
              include: {
                author: true,
              },
            },
            sender: true,
            vacancy: {
              include: {
                author: true,
              },
            },
          },
        })

        return match
      })
    ),
  }
}
