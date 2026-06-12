import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { CustomerSessionsService } from './customer-sessions.service';

type CreateCustomerSessionBody = {
  qrCodeToken?: unknown;
};

@Controller('customer-sessions')
export class CustomerSessionsController {
  constructor(
    private readonly customerSessionsService: CustomerSessionsService,
  ) {}

  @Post()
  createCustomerSession(@Body() body: CreateCustomerSessionBody) {
    if (
      typeof body.qrCodeToken !== 'string' ||
      body.qrCodeToken.trim().length === 0
    ) {
      throw new HttpException(
        {
          message: 'qrCodeToken must be a non-empty string',
          code: 'QR_CODE_TOKEN_REQUIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.customerSessionsService.createCustomerSession(
      body.qrCodeToken.trim(),
    );
  }
}
