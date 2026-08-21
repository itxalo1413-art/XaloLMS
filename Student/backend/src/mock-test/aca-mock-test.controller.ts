import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateStaffMockTestDto } from './dto/create-staff-mock-test.dto';
import { ReviewMockTestDto } from './dto/review-mock-test.dto';
import { MockTestService } from './mock-test.service';

@Controller('aca/mock-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA', 'SALE', 'GV')
export class AcaMockTestController {
  constructor(private readonly mockTests: MockTestService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.mockTests.listForAca(status);
  }

  @Post()
  async create(@Body() body: CreateStaffMockTestDto) {
    const request = await this.mockTests.createForStaff(body ?? {});
    return { request };
  }

  @Patch(':id/approve')
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
