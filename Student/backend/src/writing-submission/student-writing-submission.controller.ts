import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { WritingSubmissionService } from './writing-submission.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('student/writing-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentWritingSubmissionController {
  constructor(private readonly writing: WritingSubmissionService) {}

  @Get()
  listMine(@Req() req: AuthedRequest) {
    return this.writing.listForStudent(req.user.sub);
  }

  @Post()
  async create(@Req() req: AuthedRequest, @Body() body: CreateWritingSubmissionDto) {
    const submission = await this.writing.createForStudent(
      req.user.sub,
      req.user.name,
      body ?? {},
    );
    return { submission };
  }
}
