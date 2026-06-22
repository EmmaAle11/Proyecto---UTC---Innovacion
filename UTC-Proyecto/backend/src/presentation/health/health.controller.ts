import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  check(): { status: string; db: boolean } {
    return { status: 'ok', db: this.dataSource.isInitialized };
  }
}
