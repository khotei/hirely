import {
  Injectable,
  type OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  cleanTables() {
    return Promise.all([
      this.user.deleteMany(),
      this.resume.deleteMany(),
      this.vacancy.deleteMany(),
      this.match.deleteMany(),
    ])
  }

  onModuleDestroy() {
    return this.$disconnect()
  }

  async onModuleInit() {
    await this.$connect()
  }
}
