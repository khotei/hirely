import { base } from "@hirely/eslint-config"

export default [
  ...base,
  {
    ignores: ["node_modules/", "dist/", "__generated__/"],
  },
]
