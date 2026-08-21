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
import { AcaManagementService } from './aca-management.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('teacher/final-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA')
export class TeacherFinalTestController {
  constructor(private readonly service: AcaManagementService) {}

  @Get()
  listAssigned(
    @Req() req: AuthedRequest,
    @Query('examinerName') examinerName?: string,
  ) {
    const name = examinerName?.trim() || req.user.name;
    return this.service.listFinalTestsForExaminer(name);
  }

  @Patch(':id/result')
  async recordResult(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateFinalTest(id, {
      ...(body ?? {}),
      status: (body?.status as string) || 'graded',
    });
  }
}
