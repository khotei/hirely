import {
  createParamDecorator,
  type ExecutionContext,
} from "@nestjs/common"
import { GqlExecutionContext } from "@nestjs/graphql"

export const Token = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context)

    const { req } = ctx.getContext()
    const isSub = Boolean(req.subscriptions)

    let token: string
    if (isSub) {
      token =
        req.connectionParams?.Authorization.split(" ").at(1)
    } else {
      token = req.headers?.authorization?.split(" ").at(1)
    }

    if (!token) {
      throw new Error(
        'Request is missing authorization header. Maybe "JwtAuthGuard" is missing.'
      )
    }

    return token
  }
)
