import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PracticeRlpService } from './practice-rlp.service';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';

/**
 * Student-only read endpoint.
 * A student fetches their own Practice RLP sessions.
 */
@Controller('student/practice-rlp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentPracticeRlpController {
  constructor(private readonly svc: PracticeRlpService) {}

  /** GET /api/student/practice-rlp — uses JWT sub (studentId) */
  @Get()
  list(@Req() req: Request & { user: JwtPayload }, @Query('studentId') qStudentId: string) {
    const studentId = req?.user?.sub || qStudentId;
    return this.svc.listSessions(studentId);
  }
}
