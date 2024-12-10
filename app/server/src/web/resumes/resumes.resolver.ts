import { UseGuards } from "@nestjs/common"
import {
  Args,
  Mutation,
  Query,
  Resolver,
} from "@nestjs/graphql"
import type { Prisma } from "@prisma/client"

import {
  type CreateResumeInput,
  type DeleteResumeInput,
  type MutationResolvers,
  type QueryResolvers,
  type ResumeInput,
  type ResumesInput,
  type UpdateResumeInput,
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

type Resolvers = Required<
  Pick<
    MutationResolvers,
    "createResume" | "deleteResume" | "updateResume"
  > &
    Pick<QueryResolvers, "resume" | "resumes">
>

@Resolver()
export class ResumesResolver implements Resolvers {
  constructor(private prismaService: PrismaService) {}

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async createResume(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: CreateResumeInput
  ) {
    const resume = await this.prismaService.resume.create({
      data: {
        ...input,
        author: {
          connect: {
            id: session.userId,
          },
        },
      },
      include: { author: true },
    })

    return {
      resume,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async deleteResume(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: DeleteResumeInput
  ) {
    const resume = await this.prismaService.resume.delete({
      include: { author: true },
      where: {
        author: {
          id: session.userId,
        },
        id: input.id,
      },
    })

    return {
      resume,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Query()
  async resume(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: ResumeInput
  ) {
    const resume =
      await this.prismaService.resume.findUniqueOrThrow({
        include: { author: true },
        where: {
          author: {
            id: session.userId,
          },
          id: input.id,
        },
      })

    return {
      resume,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Query()
  async resumes(
    @Session()
    session: SessionPayload,
    @Args("input")
    input?: ResumesInput
  ) {
    const where: Prisma.ResumeWhereInput = {
      author: {
        id: session.userId,
      },
    }
    if (input?.id) {
      where.id = { in: input.id }
    }

    const page = calcPage({ page: input?.pagination?.page })

    const resumes =
      await this.prismaService.resume.findMany({
        include: { author: true },
        skip: calcSkip({ page }),
        take: PAGE_SIZE,
        where,
      })

    const totalCount =
      await this.prismaService.resume.count({
        where,
      })
    const nextPage = calcNextPage({
      page,
      total: totalCount,
    })

    return {
      pagination: {
        nextPage,
        page,
      },
      resumes,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async updateResume(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: UpdateResumeInput
  ) {
    const resume = await this.prismaService.resume.update({
      data: input,
      include: { author: true },
      where: {
        author: {
          id: session.userId,
        },
        id: input.id,
      },
    })

    return {
      resume,
    }
  }
}
