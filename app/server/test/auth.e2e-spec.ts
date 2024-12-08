import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"

import { getSdk } from "@/__generated__/gql-sdk"
import { AppModule } from "@/web/app.module"

import { createRequester } from "./lib/requester"

describe("AuthResolver (e2e)", () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it("/ (GET)", async () => {
    console.log(await getSdk(createRequester(app)).Auth())
  })
})
