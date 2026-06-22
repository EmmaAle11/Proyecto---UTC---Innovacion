import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource para el CLI de TypeORM (migration:generate/run/revert).
 * Carga backend/.env (dotenv) porque corre fuera de NestJS. El esquema se crea
 * SOLO por migraciones (synchronize:false, rules §11).
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'utc',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'utc_food',
  uuidExtension: 'pgcrypto', // usa gen_random_uuid() (pgcrypto ya instalado), no uuid-ossp
  entities: [__dirname + '/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});

export default AppDataSource;
