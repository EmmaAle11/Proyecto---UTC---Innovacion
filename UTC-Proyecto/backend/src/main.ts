import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  // HTTPS: condicional vía HTTPS_ENABLED env var (regla V7 ASVS).
  // ponytail: loadSync solo si enabled, error temprano si archivos no existen.
  let httpsOptions: any = undefined;
  if (process.env.HTTPS_ENABLED === 'true') {
    const certPath = process.env.HTTPS_CERT_PATH || './cert.pem';
    const keyPath = process.env.HTTPS_KEY_PATH || './key.pem';
    try {
      httpsOptions = {
        cert: fs.readFileSync(certPath, 'utf-8'),
        key: fs.readFileSync(keyPath, 'utf-8'),
      };
    } catch (err) {
      throw new Error(
        `[HTTPS] No se pueden cargar certificados:\n` +
        `  cert: ${certPath}\n` +
        `  key: ${keyPath}\n` +
        `Genera con: openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365\n` +
        `Error: ${err.message}`,
      );
    }
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Input validation (regla #5 — whitelist mode).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Security headers (OWASP ASVS L2 V10).
  // ponytail: helmet defaults + CSP básico (allow self, unsafe-inline para dev).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // dev: nativewind inline; prod: revisar
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' }, // clickjacking
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
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

  await app.listen(process.env.PORT ?? 3002);
}
void bootstrap();
