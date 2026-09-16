import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PracticeRlpService } from './practice-rlp.service';
import { StudentUpdatePracticeRlpHomeworkDto } from './dto/practice-rlp.dto';
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

  /** PATCH /api/student/practice-rlp/:no — học viên đánh dấu đã nộp / hủy nộp BTVN */
  @Patch(':no')
  async updateHomework(
    @Req() req: Request & { user: JwtPayload },
    @Param('no', ParseIntPipe) no: number,
    @Body() body: StudentUpdatePracticeRlpHomeworkDto,
  ) {
    const studentId = req.user.sub;
    const session = await this.svc.updateStudentHomework(studentId, no, body.homeworkStatus);
    return { session };
  }
}
