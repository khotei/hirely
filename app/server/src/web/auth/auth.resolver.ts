import { UseGuards } from "@nestjs/common"
import {
  Args,
  Mutation,
  Query,
  Resolver,
} from "@nestjs/graphql"
import { JwtService } from "@nestjs/jwt"
import type { User } from "@prisma/client"
import { GraphQLError } from "graphql/error"

import {
  type LoginInput,
  type MutationResolvers,
  type QueryResolvers,
  type RegisterInput,
} from "@/__generated__/schema"
import { PrismaService } from "@/common/services/prisma.service"
import {
  Auth,
  type AuthPayload,
} from "@/web/auth/decorators/auth.decorator"
import { Token } from "@/web/auth/decorators/token.decorator"
import { JwtAuthGuard } from "@/web/auth/guards/jwt-auth.guard"
import { JWT_SECRET } from "@/web/auth/lib/jwt.constants"

type Resolvers = Required<
  Pick<MutationResolvers, "login" | "register"> &
    Pick<QueryResolvers, "auth">
>

@Resolver("Auth")
export class AuthResolver implements Resolvers {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Query()
  async auth(
    @Auth() auth: AuthPayload,
    @Token() token: string
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: auth.userId,
      },
    })

    if (!user) {
      throw new Error("Can't find authenticated user.")
    }

    return {
      token,
      user,
    }
  }

  async generateToken({ user }: { user: User }) {
    const jwtPayload: AuthPayload = {
      role: user.role,
      userId: user.id,
    }

    const token = await this.jwtService.signAsync(
      jwtPayload,
      {
        secret: JWT_SECRET,
      }
    )

    return { token }
  }

  @Mutation()
  async login(@Args("input") input: LoginInput) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: input.email,
      },
    })

    if (!user) {
      throw new GraphQLError("User not found.")
    }

    const { token } = await this.generateToken({ user })

    return {
      token,
      user,
    }
  }

  @Mutation()
  async register(@Args("input") input: RegisterInput) {
    const user = await this.prismaService.user.create({
      data: input,
    })
    const { token } = await this.generateToken({ user })

    return {
      token,
      user,
    }
  }
}
