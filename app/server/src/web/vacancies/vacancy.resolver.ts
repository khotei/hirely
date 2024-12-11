import { UseGuards } from "@nestjs/common"
import {
  Args,
  Mutation,
  Query,
  Resolver,
} from "@nestjs/graphql"
import type { Prisma } from "@prisma/client"

import {
  type CreateVacancyInput,
  type DeleteVacancyInput,
  type MutationResolvers,
  type QueryResolvers,
  type UpdateVacancyInput,
  type VacanciesInput,
  type VacancyInput,
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
    "createVacancy" | "deleteVacancy" | "updateVacancy"
  > &
    Pick<QueryResolvers, "vacancies" | "vacancy">
>

@Resolver()
export class VacancyResolver implements Resolvers {
  constructor(private prismaService: PrismaService) {}

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async createVacancy(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: CreateVacancyInput
  ) {
    const vacancy = await this.prismaService.vacancy.create(
      {
        data: {
          ...input,
          author: {
            connect: {
              id: session.userId,
            },
          },
        },
        include: { author: true },
      }
    )

    return {
      vacancy,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async deleteVacancy(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: DeleteVacancyInput
  ) {
    const vacancy = await this.prismaService.vacancy.delete(
      {
        include: { author: true },
        where: {
          author: {
            id: session.userId,
          },
          id: input.id,
        },
      }
    )

    return {
      vacancy,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Mutation()
  async updateVacancy(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: UpdateVacancyInput
  ) {
    const vacancy = await this.prismaService.vacancy.update(
      {
        data: input,
        include: { author: true },
        where: {
          author: {
            id: session.userId,
          },
          id: input.id,
        },
      }
    )

    return {
      vacancy,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Query()
  async vacancies(
    @Session()
    session: SessionPayload,
    @Args("input")
    input?: VacanciesInput
  ) {
    const where: Prisma.VacancyWhereInput = {
      author: {
        id: session.userId,
      },
    }
    if (input?.id) {
      where.id = { in: input.id }
    }

    const page = calcPage({ page: input?.pagination?.page })

    const vacancies =
      await this.prismaService.vacancy.findMany({
        include: { author: true },
        skip: calcSkip({ page }),
        take: PAGE_SIZE,
        where,
      })

    const totalCount =
      await this.prismaService.vacancy.count({
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
      vacancies,
    }
  }

  @UseGuards(JwtSessionGuard)
  @Query()
  async vacancy(
    @Session()
    session: SessionPayload,
    @Args("input")
    input: VacancyInput
  ) {
    const vacancy =
      await this.prismaService.vacancy.findUniqueOrThrow({
        include: { author: true },
        where: {
          author: {
            id: session.userId,
          },
          id: input.id,
        },
      })

    return {
      vacancy,
    }
  }
}
