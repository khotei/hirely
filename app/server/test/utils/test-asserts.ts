import {
  MatchFragment,
  type ResumeFragment,
  type SessionFragment,
  type UserFragment,
  type VacancyFragment,
} from "@/__generated__/schema"

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

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

// auth

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

// resumes

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

// vacancies

export const expectVacancy = ({
  actual,
  author,
  expected,
}: {
  actual: VacancyFragment
  author?: UserFragment
  expected: DeepPartial<VacancyFragment>
}) => {
  const { id, ...rest } = expected
  expect(actual).toEqual({
    id: id ?? expect.any(String),
    ...rest,
    author: author ?? expected.author,
    authorId: author?.id ?? expected.authorId,
  })
}

// matches

export const expectMatch = ({
  actual,
  expected,
}: {
  actual: MatchFragment
  expected: DeepPartial<MatchFragment>
}) => {
  const {
    createdAt = expect.any(String),
    id = expect.any(String),
    updatedAt = expect.any(String),
    ...rest
  } = expected

  expect(actual).toEqual({
    createdAt,
    id,
    updatedAt,
    ...rest,
  })
}
