import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TeacherAttendanceService } from './teacher-attendance.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('teacher/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA')
export class TeacherAttendanceController {
  constructor(private readonly attendanceService: TeacherAttendanceService) {}

  @Get()
  getAttendance(@Req() req: AuthedRequest) {
    return this.attendanceService.getAttendanceMap(req.user.email);
  }

  @Patch(':sessionId')
  toggleAttendance(
    @Req() req: AuthedRequest,
    @Param('sessionId') sessionId: string,
    @Body() body: { attended?: boolean },
  ) {
    return this.attendanceService.toggleAttendance(
      req.user.email,
      sessionId,
      body?.attended,
    );
  }
}
