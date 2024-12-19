import { UseGuards } from "@nestjs/common"
import { Args, Mutation, Resolver } from "@nestjs/graphql"
import { GraphQLError } from "graphql/error"

import {
  type CreateMatchInput,
  type MutationResolvers,
  type QueryResolvers,
} from "@/__generated__/schema"
import { PrismaService } from "@/common/services/prisma.service"
import {
  Session,
  type SessionPayload,
} from "@/web/auth/decorators/session.decorator"
import { JwtSessionGuard } from "@/web/auth/guards/jwt-session.guard"

type Resolvers = Required<
  Pick<MutationResolvers, "createMatch"> &
    Pick<QueryResolvers, "matches">
>

@Resolver()
export class MatchesResolver implements Resolvers {
  constructor(private prismaService: PrismaService) {}

  private getReceiverId({
    resumeAuthorId,
    senderId,
    vacancyAuthorId,
  }: {
    resumeAuthorId: string
    senderId: string
    vacancyAuthorId: string
  }): string {
    return resumeAuthorId === senderId
      ? vacancyAuthorId
      : resumeAuthorId
  }

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async createMatch(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: CreateMatchInput
  ) {
    const match = await this.prismaService.match.findFirst({
      where: {
        resumeId: input.resumeId,
        vacancyId: input.vacancyId,
      },
    })

    if (match) {
      throw new GraphQLError(
        "Match with the given vacancyId and resumeId already exist"
      )
    }

    const vacancy =
      await this.prismaService.vacancy.findUniqueOrThrow({
        where: {
          id: input.vacancyId,
        },
      })
    const resume =
      await this.prismaService.resume.findUniqueOrThrow({
        where: {
          id: input.resumeId,
        },
      })
    if (
      ![resume.authorId, vacancy.authorId].includes(
        session.userId
      )
    ) {
      throw new GraphQLError(
        "user hasn't vacancy nor resume. not found"
      )
    }

    const newMatch = await this.prismaService.match.create({
      data: {
        receiver: {
          connect: {
            id: this.getReceiverId({
              resumeAuthorId: resume.authorId,
              senderId: session.userId,
              vacancyAuthorId: vacancy.authorId,
            }),
          },
        },
        resume: { connect: { id: resume.id } },
        sender: { connect: { id: session.userId } },
        vacancy: { connect: { id: vacancy.id } },
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
      match: newMatch,
    }
  }

  matches() {
    return {
      matches: [],
      pagination: { nextPage: 2, page: 1 },
    }
  }
}
