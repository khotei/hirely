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

const auth = {
  modules: [
    PassportModule.register({ property: "auth" }),
    JwtModule.register({
      secret: JWT_SECRET,
    }),
  ],
  providers: [AuthResolver, JwtStrategy],
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
  providers: [PrismaService, ...auth.providers],
})
export class AppModule {}
