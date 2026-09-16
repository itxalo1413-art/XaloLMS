import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentLmsBridgeController {
  constructor(private readonly aca: AcaManagementService) {}

  @Get('one-to-one')
  getOneToOne(@Req() req: AuthedRequest) {
    return this.aca.findOneToOneForStudent({
      email: req.user.email,
      name: req.user.name,
      userId: req.user.sub,
    });
  }

  @Get('weekly-docs')
  getWeeklyDocs(@Req() req: AuthedRequest) {
    return this.aca.findWeeklyDocsForStudent({
      email: req.user.email,
      name: req.user.name,
      userId: req.user.sub,
    });
  }

  @Patch('weekly-docs/:id')
  submitWeeklyDoc(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { link?: string },
  ) {
    return this.aca.studentSubmitWeeklyDoc(
      id,
      {
        email: req.user.email,
        name: req.user.name,
        userId: req.user.sub,
      },
      String(body?.link || ''),
    );
  }
}
