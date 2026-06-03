import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

type AiTestRequestBody = {
  message?: unknown;
};

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('test')
  async testGemini(@Body() body: AiTestRequestBody) {
    if (typeof body.message !== 'string' || body.message.trim().length === 0) {
      throw new BadRequestException('message must be a non-empty string');
    }

    const reply = await this.aiService.generateText(body.message);

    return { reply };
  }
}
