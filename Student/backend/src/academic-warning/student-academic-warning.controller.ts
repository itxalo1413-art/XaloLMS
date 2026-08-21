import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AcademicWarningService } from './academic-warning.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('student/academic-warnings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentAcademicWarningController {
  constructor(private readonly service: AcademicWarningService) {}

  @Get()
  listMine(@Req() req: AuthedRequest) {
    return this.service.listForStudent({
      studentId: req.user.sub,
      email: req.user.email,
      name: req.user.name,
    });
  }

  @Put(':id/dismiss')
  async dismissMine(@Req() req: AuthedRequest, @Param('id') id: string) {
    const mine = await this.service.listForStudent({
      studentId: req.user.sub,
      email: req.user.email,
      name: req.user.name,
    });
    if (!mine.some((row) => row.id === id)) {
      throw new NotFoundException('Không tìm thấy cảnh báo học tập');
    }
    return this.service.dismissForStudent(id);
  }
}
