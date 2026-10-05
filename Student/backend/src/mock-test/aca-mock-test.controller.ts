import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateStaffMockTestDto } from './dto/create-staff-mock-test.dto';
import { ReviewMockTestDto } from './dto/review-mock-test.dto';
import { MockTestService } from './mock-test.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('aca/mock-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA', 'SALE', 'GV', 'GRADER')
export class AcaMockTestController {
  constructor(private readonly mockTests: MockTestService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query('status') status?: string) {
    return this.mockTests.listForAca(status, req.user);
  }

  @Post()
  async create(@Body() body: CreateStaffMockTestDto) {
    const request = await this.mockTests.createForStaff(body ?? {});
    return { request };
  }

  @Patch(':id/approve')
  @Roles('ACA', 'SALE')
  async approve(@Param('id') id: string, @Body() body: ReviewMockTestDto) {
    const request = await this.mockTests.approve(id, body ?? {});
    return { request };
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    const request = await this.mockTests.reject(id);
    return { request };
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    const request = await this.mockTests.cancelByStaff(id);
    return { request };
  }
}
