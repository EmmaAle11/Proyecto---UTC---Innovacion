import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  it('devuelve status ok y el estado de la BD', async () => {
    const fakeDataSource = { isInitialized: true } as DataSource;
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: fakeDataSource }],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.check()).toEqual({ status: 'ok', db: true });
  });
});
