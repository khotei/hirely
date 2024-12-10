import { type SessionFragment } from "@/__generated__/schema"

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export const expectSession = ({
  actual,
  expected,
}: {
  actual: SessionFragment
  expected: DeepPartial<SessionFragment>
}) => {
  expect(actual).toEqual({
    token: expected.token ?? expect.any(String),
    user: {
      email: expected.user.email,
      id: expected.user.id ?? expect.any(String),
      role: expected.user.role,
    },
  })
}
