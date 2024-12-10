import {
  createParamDecorator,
  type ExecutionContext,
} from "@nestjs/common"
import { GqlExecutionContext } from "@nestjs/graphql"
import { User } from "@prisma/client"

export type SessionPayload = { userId: User["id"] } & Pick<
  User,
  "role"
>

export const Session = createParamDecorator(
  (
    data: unknown,
    context: ExecutionContext
  ): SessionPayload => {
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
