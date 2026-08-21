import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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

@Controller('student/final-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentFinalTestController {
  constructor(private readonly service: AcaManagementService) {}

  @Get()
  listMine(@Req() req: AuthedRequest) {
    return this.service.listFinalTestsForStudent({
      studentId: req.user.sub,
      email: req.user.email,
      name: req.user.name,
    });
  }

  @Get('eligibility')
  eligibility(@Req() req: AuthedRequest) {
    return this.service.getFinalTestEligibilityForStudent({
      studentId: req.user.sub,
      email: req.user.email,
    });
  }

  @Post()
  async createMine(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    await this.service.assertStudentCanRegisterFinalTest({
      studentId: req.user.sub,
      email: req.user.email,
    });
    return this.service.createFinalTest({
      ...(body ?? {}),
      candidateName: (body?.candidateName as string) || req.user.name,
      candidateEmail: (body?.candidateEmail as string) || req.user.email,
      studentId: (body?.studentId as string) || req.user.sub,
      isChecked: false,
      isDone: false,
    });
  }

  @Put(':id/cancel')
  async cancelMine(@Req() req: AuthedRequest, @Param('id') id: string) {
    await this.assertOwned(req, id);
    return this.service.cancelFinalTest(id);
  }

  private async assertOwned(req: AuthedRequest, id: string) {
    const mine = await this.service.listFinalTestsForStudent({
      studentId: req.user.sub,
      email: req.user.email,
      name: req.user.name,
    });
    if (!mine.some((row) => row.id === id)) {
      throw new Error('Không tìm thấy ca Final Test');
    }
  }
}
