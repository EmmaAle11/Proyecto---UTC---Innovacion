import { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ProductsController } from './products.controller';
import { ProductsService } from '../application/products.service';

/**
 * Test HTTP del controller con el `ProductsService` mockeado (sin BD/Keycloak).
 * Los guards globales (JWT/roles) no se registran en este módulo de prueba, así
 * que el request llega al handler y se ejercita el `ParseUUIDPipe` del `:id`.
 */
describe('ProductsController (HTTP)', () => {
  let app: INestApplication;
  const service = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  // Regresión: antes un `:id` no-UUID llegaba a Postgres y reventaba con 500.
  it('PATCH /products/:id con UUID inválido → 400 (ParseUUIDPipe)', async () => {
    await request(app.getHttpServer() as Server)
      .patch('/products/not-a-uuid')
      .send({ price: 10 })
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('PATCH /products/:id con UUID válido → delega en el service', async () => {
    service.update.mockResolvedValue({
      id: 'ok',
      price: 10,
      statusChangedAt: new Date(),
    });
    await request(app.getHttpServer() as Server)
      .patch('/products/a0000000-0000-4000-8000-000000000001')
      .send({ price: 10 })
      .expect(200);
    expect(service.update).toHaveBeenCalledTimes(1);
  });
});
