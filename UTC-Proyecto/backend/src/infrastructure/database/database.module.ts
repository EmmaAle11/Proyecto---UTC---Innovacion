import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'utc'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'utc_food'),
        uuidExtension: 'pgcrypto', // gen_random_uuid() (pgcrypto), coherente con las migraciones
        autoLoadEntities: true,
        synchronize: false, // rules §11: nada de synchronize para cambios de esquema
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        migrationsRun: false, // las corre el CLI (npm run migration:run), no el arranque
      }),
    }),
  ],
})
export class DatabaseModule {}
