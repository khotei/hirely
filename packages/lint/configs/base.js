import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist"
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export const base = tseslint.config(
  js.configs.all,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "no-console": "off",
      "sort-imports": "off",
      "one-var": "off",
      "max-lines-per-function": "off",
      "no-ternary": "off",
      "no-undefined": "off",
      "no-magic-numbers": "off",
      "consistent-return": "off",
      "capitalized-comments": "off",
      "no-else-return": "off",
      "max-statements": "off",
      "init-declarations": "off",
      "new-cap": "off",
      "class-methods-use-this": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    }
  },
  {
    ...perfectionist.configs["recommended-alphabetical"],
    rules: {
      ...perfectionist.configs["recommended-alphabetical"].rules,
      "perfectionist/sort-imports": [
        "error",
        {
          customGroups: {
            value: {
              builtin: "node:*",
            },
          },
          environment: "node",
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          ignoreCase: true,
          internalPattern: ["@/**"],
          newlinesBetween: "always",
          order: "asc",
          type: "alphabetical",
        },
      ],
    },
  },
  {
    ...prettier,
    rules: {
      ...prettier.rules,
      "prettier/prettier": [
        "error",
        {
          arrowParens: "always",
          bracketSameLine: true ,
          bracketSpacing: true,
          endOfLine: "auto",
          htmlWhitespaceSensitivity: "css",
          insertPragma: false,
          printWidth: 60,
          proseWrap: "preserve",
          quoteProps: "as-needed",
          requirePragma: false,
          semi: false,
          singleAttributePerLine: true,
          singleQuote: false,
          jsxSingleQuote: false,
          tabWidth: 2,
          trailingComma: "es5",
        },
      ],
    },
  }
)