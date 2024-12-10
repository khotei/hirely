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
import { ResumesResolver } from "@/web/resumes/resumes.resolver"

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
  ],
})
export class AppModule {}
