import { INestApplication } from "@nestjs/common"
import * as request from "supertest"

import { Requester } from "@/__generated__/gql-sdk"

export const createRequester = (
  app: INestApplication
): Requester => {
  return async (doc, vars) => {
    const response = await request(app.getHttpServer())
      .post("/graphql")
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
