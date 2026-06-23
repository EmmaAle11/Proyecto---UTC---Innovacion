import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // CORS: por defecto refleja cualquier origen (dev); en prod EXIGE CORS_ORIGIN (lista por comas).
  const corsOrigin = process.env.CORS_ORIGIN;
  if (process.env.NODE_ENV === 'production' && !corsOrigin) {
    throw new Error(
      'CORS_ORIGIN es obligatorio en producción: no se permite reflejar cualquier origen (origin:true).',
    );
  }
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
