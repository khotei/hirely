import {
  type ResumeFragment,
  type SessionFragment,
  type UserFragment,
} from "@/__generated__/schema"

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

export const expectResume = ({
  actual,
  author,
  expected,
}: {
  actual: ResumeFragment
  author?: UserFragment
  expected: DeepPartial<ResumeFragment>
}) => {
  const { id, ...rest } = expected
  expect(actual).toEqual({
    id: id ?? expect.any(String),
    ...rest,
    author: author ?? expected.author,
    authorId: author?.id ?? expected.authorId,
  })
}

export const expectError = async <
  R,
  T extends () => Promise<R>,
>({
  exec,
  message,
}: {
  exec: T
  message: string
}) => {
  await expect(exec()).rejects.toThrow(
    new RegExp(message, "iu")
  )
}
