import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

type SendChatMessageBody = {
  sessionToken?: unknown;
  message?: unknown;
};

@Controller('chat/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  sendMessage(@Body() body: SendChatMessageBody) {
    if (
      typeof body.sessionToken !== 'string' ||
      body.sessionToken.trim().length === 0
    ) {
      throw new HttpException(
        {
          message: 'sessionToken must be a non-empty string',
          code: 'SESSION_TOKEN_REQUIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (typeof body.message !== 'string' || body.message.trim().length === 0) {
      throw new HttpException(
        {
          message: 'message must be a non-empty string',
          code: 'MESSAGE_REQUIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.chatService.sendMessage(
      body.sessionToken.trim(),
      body.message.trim(),
    );
  }
}
