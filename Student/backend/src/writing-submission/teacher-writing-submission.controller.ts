import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GradeWritingSubmissionDto } from './dto/grade-writing-submission.dto';
import { WritingSubmissionService } from './writing-submission.service';

@Controller('teacher/writing-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV')
export class TeacherWritingSubmissionController {
  constructor(private readonly writing: WritingSubmissionService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.writing.listForTeacher(status);
  }

  @Patch(':id/grade')
  async grade(
    @Param('id') id: string,
    @Body() body: GradeWritingSubmissionDto,
  ) {
    const submission = await this.writing.grade(id, body ?? {});
    return { submission };
  }
}
