import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"

import type { SessionPayload } from "@/web/auth/decorators/session.decorator"
import { JWT_SECRET } from "@/web/auth/lib/jwt.constants"

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          const isSub = Boolean(req.subscriptions)
          if (isSub) {
            return req.connectionParams?.Authorization.split(
              " "
            ).at(1)
          } else {
            return req.headers?.authorization
              ?.split(" ")
              .at(1)
          }
        },
      ]),
      secretOrKey: JWT_SECRET,
    })
  }

  validate(payload: SessionPayload): SessionPayload {
    return payload
  }
}
