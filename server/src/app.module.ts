import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { CustomerSessionsModule } from './customer-sessions/customer-sessions.module';
import { MenuModule } from './menu/menu.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, MenuModule, AiModule, CustomerSessionsModule, ChatModule],
})
export class AppModule {}
