import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReviewMockTestDto } from './dto/review-mock-test.dto';
import { MockTestService } from './mock-test.service';

@Controller('aca/mock-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class AcaMockTestController {
  constructor(private readonly mockTests: MockTestService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.mockTests.listForAca(status);
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
}
