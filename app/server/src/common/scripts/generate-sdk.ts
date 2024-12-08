import { join } from "path"

import {
  type CodegenConfig,
  generate,
} from "@graphql-codegen/cli"

const reqGenConfig: CodegenConfig = {
  documents: join(__dirname, "../../web/**/*.gql"),
  generates: {
    [join(__dirname, "../../__generated__/gql-sdk.ts")]: {
      config: {
        rawRequest: false,
        skipTypename: true,
        useIndexSignature: true,
      },
      plugins: [
        "typescript-generic-sdk",
        "typescript",
        "typescript-operations",
      ],
    },
  },
  schema: join(__dirname, "../../web/**/*.gql"),
}

generate(reqGenConfig)
