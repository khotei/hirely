import { join } from "path"

import {
  type GenerateOptions,
  GraphQLDefinitionsFactory,
} from "@nestjs/graphql"

const definitionsFactory = new GraphQLDefinitionsFactory()
const definitionsConfig: GenerateOptions = {
  path: join(__dirname, "../../__generated__/schema.ts"),
  typePaths: [join(__dirname, "../../web/**/*.gql")],
}

definitionsFactory.generate(definitionsConfig)
