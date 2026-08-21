import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RlpService } from './rlp.service';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import type { HomeworkStatus } from './rlp.types';

@Controller('student/rlp-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentRlpController {
  constructor(private readonly rlp: RlpService) {}

  @Get()
  list(@Req() req: Request & { user: JwtPayload }) {
    return this.rlp.listSessionsForStudent(req?.user?.email);
  }

  @Patch(':no')
  updateMine(
    @Req() req: Request & { user: JwtPayload },
    @Param('no', ParseIntPipe) no: number,
    @Body() body: { homeworkStatus?: HomeworkStatus },
  ) {
    const status = body?.homeworkStatus;
    if (status !== 'submitted_waiting' && status !== 'in_progress') {
      throw new BadRequestException('Học viên chỉ được đánh dấu Đã nộp hoặc Chưa nộp');
    }
    return this.rlp.updateHomeworkForStudent(req.user.email, no, status).then((session) => ({
      session,
    }));
  }
}
