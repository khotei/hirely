import { type MatchStatus } from "@prisma/client"
import { GraphQLError } from "graphql/error"

export const validateUpdateMatchStatusInput = ({
  receiverId,
  senderId,
  status,
  userId,
}: {
  receiverId: string
  senderId: string
  status: MatchStatus
  userId: string
}) => {
  if (status === "PENDING") {
    throw new GraphQLError(
      "The status 'PENDING' cannot be set explicitly"
    )
  }

  if (
    ["ACCEPTED", "REJECTED"].includes(status) &&
    userId !== receiverId
  ) {
    throw new GraphQLError(
      "Only the receiver can accept or reject the match"
    )
  }

  if (status === "CANCELED" && userId !== senderId) {
    throw new GraphQLError(
      "Only the sender can cancel the match"
    )
  }
}
