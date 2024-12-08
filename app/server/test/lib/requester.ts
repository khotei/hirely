import { INestApplication } from "@nestjs/common"
import * as request from "supertest"

import { Requester } from "@/__generated__/schema"

export const createRequester = (
  app: INestApplication,
  { token }: { token?: string } = {}
): Requester => {
  return async (doc, vars) => {
    const response = await request(app.getHttpServer())
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: doc.loc?.source.body,
        variables: vars,
      })

    if (response.body.errors) {
      throw new Error(JSON.stringify(response.body.errors))
    }

    return response.body.data
  }
}
