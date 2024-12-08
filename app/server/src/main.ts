import { NestFactory } from "@nestjs/core"

import { AppModule } from "@/web/app.module"

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: "*",
  })

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
