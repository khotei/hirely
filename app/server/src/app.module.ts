import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default"
import {
  ApolloDriver,
  type ApolloDriverConfig,
} from "@nestjs/apollo"
import { Module } from "@nestjs/common"
import { GraphQLModule } from "@nestjs/graphql"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"

import { PrismaService } from "@/common/services/prisma.service"
import { AuthResolver } from "@/web/auth/auth.resolver"
import { JWT_SECRET } from "@/web/auth/lib/jwt.constants"
import { JwtStrategy } from "@/web/auth/passport/jwt.strategy"
import { MatchesResolver } from "@/web/matches/matches.resolver"
import { ResumesResolver } from "@/web/resumes/resumes.resolver"
import { VacancyResolver } from "@/web/vacancies/vacancy.resolver"

const auth = {
  modules: [
    PassportModule.register({ property: "auth" }),
    JwtModule.register({
      secret: JWT_SECRET,
    }),
  ],
  providers: [AuthResolver, JwtStrategy],
}

const resumes = {
  providers: [ResumesResolver],
}

const vacancies = {
  providers: [VacancyResolver],
}

const matches = {
  providers: [MatchesResolver],
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault(),
      ],
      typePaths: ["src/web/**/*.gql"],
    }),
    ...auth.modules,
  ],
  providers: [
    PrismaService,
    ...auth.providers,
    ...resumes.providers,
    ...vacancies.providers,
    ...matches.providers,
  ],
})
export class AppModule {}
