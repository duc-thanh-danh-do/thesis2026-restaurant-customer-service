import { Module } from '@nestjs/common';
import { CustomerSessionsController } from './customer-sessions.controller';
import { CustomerSessionsService } from './customer-sessions.service';

@Module({
  controllers: [CustomerSessionsController],
  providers: [CustomerSessionsService],
})
export class CustomerSessionsModule {}
