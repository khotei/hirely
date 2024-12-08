import {
  Args,
  Mutation,
  Query,
  Resolver,
} from "@nestjs/graphql"

import {
  type IMutation,
  type IQuery,
  type RegisterInput,
  UserRole,
} from "@/__generated__/schema"

type Resolver = Pick<IMutation, "register"> &
  Pick<IQuery, "auth">

@Resolver()
export class AuthResolver implements Resolver {
  @Query()
  auth() {
    return Promise.resolve({
      email: "test@email.com",
      id: "1",
      role: UserRole.CANDIDATE,
    })
  }

  @Mutation()
  register(@Args("input") input: RegisterInput) {
    return Promise.resolve({
      email: input.email,
      id: "1",
      role: UserRole.HR,
    })
  }
}
