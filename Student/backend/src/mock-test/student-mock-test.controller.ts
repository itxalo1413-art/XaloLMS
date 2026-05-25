import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMockTestDto } from './dto/create-mock-test.dto';
import { MockTestService } from './mock-test.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('student/mock-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentMockTestController {
  constructor(private readonly mockTests: MockTestService) {}

  @Get()
  listMine(@Req() req: AuthedRequest) {
    return this.mockTests.listForStudent(req.user.sub);
  }

  @Post()
  async create(@Req() req: AuthedRequest, @Body() body: CreateMockTestDto) {
    const request = await this.mockTests.createForStudent(req.user.sub, body ?? {});
    return { request };
  }

  @Delete(':id')
  async cancel(@Req() req: AuthedRequest, @Param('id') id: string) {
    await this.mockTests.cancelPending(req.user.sub, id);
    return { ok: true };
  }
}
