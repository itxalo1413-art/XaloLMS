import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GradeWritingSubmissionDto } from './dto/grade-writing-submission.dto';
import { WritingSubmissionService } from './writing-submission.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('teacher/writing-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA', 'GRADER')
export class TeacherWritingSubmissionController {
  constructor(private readonly writing: WritingSubmissionService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.writing.listForTeacher(status);
  }

  @Patch(':id/grade')
  async grade(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: GradeWritingSubmissionDto,
  ) {
    const submission = await this.writing.grade(id, body ?? {}, req.user);
    return { submission };
  }
}
