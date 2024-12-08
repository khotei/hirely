import {
  createParamDecorator,
  type ExecutionContext,
} from "@nestjs/common"
import { GqlExecutionContext } from "@nestjs/graphql"

import { User } from "@/__generated__/prisma-client"

export type AuthPayload = { userId: User["id"] } & Pick<
  User,
  "role"
>

export const Auth = createParamDecorator(
  (
    data: unknown,
    context: ExecutionContext
  ): AuthPayload => {
    const ctx = GqlExecutionContext.create(context)
    const { auth } = ctx.getContext().req

    if (!auth) {
      throw new Error(
        'Request is missing auth. Maybe "JwtAuthGuard" is missing.'
      )
    }

    return auth
  }
)
