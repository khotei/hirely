import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default"
import {
  ApolloDriver,
  type ApolloDriverConfig,
} from "@nestjs/apollo"
import { Module } from "@nestjs/common"
import { GraphQLModule } from "@nestjs/graphql"

import { AuthResolver } from "@/web/auth/auth.resolver"

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
  ],
  providers: [AuthResolver],
})
export class AppModule {}
