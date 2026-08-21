import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AcademicWarningService } from './academic-warning.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('teacher/academic-warnings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA')
export class TeacherAcademicWarningController {
  constructor(private readonly service: AcademicWarningService) {}

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('teacherName') teacherName?: string,
  ) {
    const name = teacherName?.trim() || req.user.name;
    return this.service.listForTeacher(name);
  }

  @Put(':id/notify')
  notify(@Param('id') id: string, @Body() body?: { message?: string }) {
    return this.service.notifyStudent(id, body);
  }
}
