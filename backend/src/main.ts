import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/response.interceptor'
import { AllExceptionsFilter } from './common/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false })
  app.setGlobalPrefix('api/v1')
  app.enableCors({ origin: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PlayPoint API')
    .setDescription('M0 冻结契约 contract-v1.0')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  const doc = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, doc, { jsonDocumentUrl: 'docs-json' })

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`\n  API   http://localhost:${port}/api/v1\n  Docs  http://localhost:${port}/docs\n`)
}

bootstrap()
