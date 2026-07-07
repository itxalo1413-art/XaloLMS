import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RlpService } from './rlp.service';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';

@Controller('student/rlp-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentRlpController {
  constructor(private readonly rlp: RlpService) {}

  @Get()
  list(@Req() req: Request & { user: JwtPayload }) {
    return this.rlp.listSessionsForStudent(req?.user?.email);
  }
}
