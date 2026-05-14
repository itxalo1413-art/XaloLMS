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
import { AcaContentService } from './aca-content.service';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateContentStatusDto } from './dto/update-content-status.dto';

@Controller('aca/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class AcaContentController {
  constructor(private readonly content: AcaContentService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const page = pageRaw ? Number(pageRaw) : 1;
    const limit = limitRaw ? Number(limitRaw) : 20;
    return this.content.list({
      status,
      category,
      q,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const item = await this.content.findById(id);
    return { item };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateContentStatusDto,
  ) {
    const item = await this.content.updateStatus(id, body?.status ?? '');
    return { item };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateContentDto) {
    const item = await this.content.update(id, body ?? {});
    return { item };
  }
}
