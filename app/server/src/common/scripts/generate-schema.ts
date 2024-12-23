import { join } from "path"

import {
  type CodegenConfig,
  generate,
} from "@graphql-codegen/cli"

const reqGenConfig: CodegenConfig = {
  documents: join(__dirname, "../../web/**/*.gql"),
  generates: {
    [join(__dirname, "../../__generated__/schema.ts")]: {
      config: {
        customResolverFn:
          "(...args: any[]) => Promise<TResult> | TResult",
        dedupeFragments: true,
        enumsAsTypes: true,
        scalars: {
          Date: {
            input: "Date",
            output: "Date",
          },
        },
        skipTypename: true,
        useIndexSignature: true,
      },
      plugins: [
        "typescript",
        "typescript-resolvers",
        "typescript-operations",
        "typescript-generic-sdk",
      ],
    },
  },
  schema: join(__dirname, "../../web/**/*.gql"),
}

generate(reqGenConfig)
