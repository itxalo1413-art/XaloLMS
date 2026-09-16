import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AcademicWarningService } from './academic-warning.service';

@Controller('aca/academic-warnings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class AcaAcademicWarningController {
  constructor(private readonly service: AcademicWarningService) {}

  @Get()
  @Roles('ACA', 'GV')
  async list(
    @Query('classId') classId?: string,
    @Query('teacherName') teacherName?: string,
  ) {
    return this.service.listAll({ classId, teacherName });
  }

  @Post('sync')
  sync() {
    return this.service.syncFromRlp(true);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body ?? {});
  }

  @Put(':id')
  @Roles('ACA', 'GV')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body ?? {});
  }

  @Put(':id/notify')
  @Roles('ACA', 'GV')
  notify(@Param('id') id: string, @Body() body?: { message?: string }) {
    return this.service.notifyStudent(id, body);
  }

  @Put(':id/dismiss')
  @Roles('ACA', 'GV')
  dismiss(@Param('id') id: string) {
    return this.service.dismissForStudent(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
