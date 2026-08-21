import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AcademicWarningService } from './academic-warning.service';

@Controller('aca/academic-warnings')
export class AcaAcademicWarningController {
  constructor(private readonly service: AcademicWarningService) {}

  @Get()
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
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body ?? {});
  }

  @Put(':id/notify')
  notify(@Param('id') id: string, @Body() body?: { message?: string }) {
    return this.service.notifyStudent(id, body);
  }

  @Put(':id/dismiss')
  dismiss(@Param('id') id: string) {
    return this.service.dismissForStudent(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
