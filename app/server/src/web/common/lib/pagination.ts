export const PAGE_SIZE = 10
export const INITIAL_PAGE = 1

export const calcSkip = ({ page }: { page: number }) =>
  (page - INITIAL_PAGE) * PAGE_SIZE

export const calcPage = ({
  page,
}: { page?: number } = {}) => page || INITIAL_PAGE

export const calcTotalPages = ({
  total,
}: {
  total: number
}) => Math.ceil(total / PAGE_SIZE)

export const calcNextPage = ({
  page,
  total,
}: {
  page?: number
  total: number
}) =>
  page < calcTotalPages({ total }) ? page + 1 : undefined
