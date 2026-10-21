import { Server } from 'http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from '../application/orders.service';
import { AuditLogService } from '../../../shared/logging/audit-log.service';

/**
 * Test HTTP del controller con el `OrdersService` mockeado y el MISMO `ValidationPipe`
 * global (whitelist + forbidNonWhitelisted). Los guards no se registran, así que la
 * validación del body se ejercita antes del handler (un body inválido → 400).
 */
describe('OrdersController (HTTP)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    findMine: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    updateStatus: jest.fn().mockResolvedValue({
      id: 'a0000000-0000-4000-8000-000000000001',
      status: 'preparing',
      totalAmount: '0',
      items: [],
      payment: null,
      user: { firstName: 'A', lastName: 'B', email: 'a@edu.utc.mx' },
      createdAt: new Date(),
      readyAt: null,
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: service },
        {
          provide: AuditLogService,
          useValue: { logOrderStateChange: jest.fn() },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    // Los guards no se registran en este test; simulamos el `req.user` que el
    // JwtAuthGuard adjuntaría, para ejercitar los handlers protegidos.
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        sub: 'kc-admin',
        email: 'admin@edu.utc.mx',
        roles: ['admin'],
        branchId: 'coop-1',
      };
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /orders sin ítems → 400 (ArrayNotEmpty), no llega al service', async () => {
    await request(app.getHttpServer() as Server)
      .post('/orders')
      .send({ items: [], payMethod: 'tdc' })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('POST /orders con campo extra (total) → 400 (forbidNonWhitelisted): el cliente no fija el total', async () => {
    await request(app.getHttpServer() as Server)
      .post('/orders')
      .send({
        items: [
          { productId: 'a0000000-0000-4000-8000-000000000001', quantity: 1 },
        ],
        payMethod: 'tdc',
        total: 1,
      })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('POST /orders con payMethod inválido → 400', async () => {
    await request(app.getHttpServer() as Server)
      .post('/orders')
      .send({
        items: [
          { productId: 'a0000000-0000-4000-8000-000000000001', quantity: 1 },
        ],
        payMethod: 'bitcoin',
      })
      .expect(400);
  });

  it('PATCH /orders/:id/status con estado inválido → 400 (IsEnum)', async () => {
    await request(app.getHttpServer() as Server)
      .patch('/orders/a0000000-0000-4000-8000-000000000001/status')
      .send({ status: 'volando' })
      .expect(400);
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('PATCH /orders/:id/status con UUID inválido → 400 (ParseUUIDPipe)', async () => {
    await request(app.getHttpServer() as Server)
      .patch('/orders/not-a-uuid/status')
      .send({ status: 'preparing' })
      .expect(400);
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('PATCH /orders/:id/status válido → delega en el service con actor+rol (F1 trazabilidad)', async () => {
    await request(app.getHttpServer() as Server)
      .patch('/orders/a0000000-0000-4000-8000-000000000001/status')
      .send({ status: 'preparing' })
      .expect(200);
    expect(service.updateStatus).toHaveBeenCalledTimes(1);
    // El actor registrado identifica el rol operativo (aquí admin), no solo el email.
    expect(service.updateStatus).toHaveBeenCalledWith(
      'a0000000-0000-4000-8000-000000000001',
      'preparing',
      'admin@edu.utc.mx (admin)',
    );
  });

  // UTC-F0-002: el alcance de cooperativa sale del JWT, NUNCA del request.
  it('GET /orders/all usa branchId del JWT (no del query)', async () => {
    await request(app.getHttpServer() as Server)
      .get('/orders/all')
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith('coop-1');
  });

  it('GET /orders/all IGNORA ?branchId= inyectado por el cliente (no hay escalada entre cooperativas)', async () => {
    await request(app.getHttpServer() as Server)
      .get('/orders/all?branchId=coop-999')
      .expect(200);
    // Debe seguir usando el del token (coop-1), nunca el inyectado (coop-999).
    expect(service.findAll).toHaveBeenCalledWith('coop-1');
    expect(service.findAll).not.toHaveBeenCalledWith('coop-999');
  });
});
