import { UseGuards } from "@nestjs/common"
import {
  Args,
  Mutation,
  Query,
  Resolver,
} from "@nestjs/graphql"
import { MatchStatus, Prisma } from "@prisma/client"
import { GraphQLError } from "graphql/error"

import {
  type CreateMatchInput,
  MatchesInput,
  type MutationResolvers,
  type QueryResolvers,
  UpdateMatchInput,
} from "@/__generated__/schema"
import { PrismaService } from "@/common/services/prisma.service"
import {
  Session,
  type SessionPayload,
} from "@/web/auth/decorators/session.decorator"
import { JwtSessionGuard } from "@/web/auth/guards/jwt-session.guard"
import {
  calcNextPage,
  calcPage,
  calcSkip,
  PAGE_SIZE,
} from "@/web/common/lib/pagination"
import { validateUpdateMatchStatusInput } from "@/web/matches/lib/match-input"

type Resolvers = Required<
  Pick<MutationResolvers, "createMatch" | "updateMatch"> &
    Pick<QueryResolvers, "matches">
>

// @todo: use guard for alls, and skip when @Public()
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

    if (match && match.status !== MatchStatus.CANCELED) {
      throw new GraphQLError(
        "Match with the given vacancyId and resumeId already exist and is not cancelled"
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

  @UseGuards(JwtSessionGuard)
  @Query()
  async matches(
    @Session()
    session: SessionPayload,
    @Args("input")
    input?: MatchesInput
  ) {
    const { userId } = session

    const userMatchesWhere: Prisma.MatchWhereInput = {
      OR: [{ senderId: userId }, { receiverId: userId }],
    }

    const page = calcPage({ page: input?.pagination?.page })

    const userMatches =
      await this.prismaService.match.findMany({
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
        skip: calcSkip({ page }),
        take: PAGE_SIZE,
        where: userMatchesWhere,
      })

    const totalCount = await this.prismaService.match.count(
      {
        where: userMatchesWhere,
      }
    )

    const nextPage = calcNextPage({
      page,
      total: totalCount,
    })

    return {
      matches: userMatches,
      pagination: {
        nextPage,
        page,
      },
    }
  }
  @UseGuards(JwtSessionGuard)
  @Mutation()
  async updateMatch(
    @Session()
    session: SessionPayload,
    @Args("input") input: UpdateMatchInput
  ) {
    const match =
      await this.prismaService.match.findUniqueOrThrow({
        include: {
          receiver: true,
          sender: true,
        },
        where: { id: input.id },
      })

    if (
      ![match.receiverId, match.senderId].includes(
        session.userId
      )
    ) {
      throw new GraphQLError(
        "User is not part of this match"
      )
    }

    validateUpdateMatchStatusInput({
      receiverId: match.receiverId,
      senderId: match.senderId,
      status: input.status,
      userId: session.userId,
    })

    const updatedMatch =
      await this.prismaService.match.update({
        data: { status: input.status },
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
        where: { id: input.id },
      })

    return {
      match: updatedMatch,
    }
  }
}
