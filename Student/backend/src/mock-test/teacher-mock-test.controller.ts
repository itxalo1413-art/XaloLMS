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
import { RecordMockTestResultDto } from './dto/record-mock-test-result.dto';
import { MockTestService } from './mock-test.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('teacher/mock-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV')
export class TeacherMockTestController {
  constructor(private readonly mockTests: MockTestService) {}

  @Get()
  listSpeaking(
    @Req() req: AuthedRequest,
    @Query('teacherName') teacherName?: string,
  ) {
    const name = teacherName?.trim() || req.user.name;
    return this.mockTests.listForTeacher(name);
  }

  @Patch(':id/result')
  async recordResult(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: RecordMockTestResultDto,
  ) {
    const name = body.teacherName?.trim() || req.user.name;
    const request = await this.mockTests.recordResult(id, name, body ?? {});
    return { request };
  }
}
