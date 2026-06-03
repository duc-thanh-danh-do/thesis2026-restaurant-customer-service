import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomerSession(qrCodeToken: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: {
        qrCodeToken,
      },
      include: {
        restaurant: true,
      },
    });

    if (!table) {
      throwApiError(
        'Restaurant table not found',
        'TABLE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!table.isActive) {
      throwApiError(
        'Restaurant table is inactive',
        'TABLE_INACTIVE',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sessionToken = `sess_${randomUUID()}`;

    const session = await this.prisma.customerSession.create({
      data: {
        restaurantId: table.restaurantId,
        tableId: table.id,
        sessionToken,
        status: 'active',
        startedAt: new Date(),
        endedAt: null,
      },
    });

    const { restaurant, ...tableResponse } = table;

    return {
      sessionToken,
      session,
      restaurant,
      table: tableResponse,
    };
  }
}

function throwApiError(
  message: string,
  code: string,
  status: HttpStatus,
): never {
  throw new HttpException({ message, code }, status);
}
