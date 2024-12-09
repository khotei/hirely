import { faker } from "@faker-js/faker"
import type { INestApplication } from "@nestjs/common"
import { UserRole } from "@prisma/client"

import {
  getSdk,
  RegisterInput,
} from "@/__generated__/schema"

import { createRequester } from "../lib/requester"

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
}) => {
  const registerInput = createRegisterInput()

  const { register } = await getSdk(
    createRequester(app)
  ).Register({
    input: registerInput,
  })

  return register
}
