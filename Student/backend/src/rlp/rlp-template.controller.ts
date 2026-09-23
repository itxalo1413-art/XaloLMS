import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  ApplyClassRlpDto,
  ApplyRlpTemplateDto,
  CreateRlpTemplateDto,
  UpdateRlpTemplateDto,
} from './dto/rlp-template.dto';
import { RlpService } from './rlp.service';

@Controller('rlp/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RlpTemplateController {
  constructor(private readonly rlp: RlpService) {}

  /** Catalog RLP từ các lớp ACA thật. */
  @Get('from-classes')
  @Roles('GV', 'ACA')
  async listFromClasses() {
    return this.rlp.listClassRlpCatalog();
  }

  @Get('from-classes/:sourceClassId')
  @Roles('GV', 'ACA')
  async getFromClass(@Param('sourceClassId') sourceClassId: string) {
    return this.rlp.getClassRlpSource(sourceClassId);
  }

  @Post('from-classes/:sourceClassId/apply')
  @Roles('GV', 'ACA')
  async applyFromClass(
    @Param('sourceClassId') sourceClassId: string,
    @Body() body: ApplyClassRlpDto,
  ) {
    return this.rlp.applyClassRlpToClass(sourceClassId, body ?? ({} as ApplyClassRlpDto));
  }

  @Get()
  @Roles('GV', 'ACA')
  async list() {
    return this.rlp.listTemplates();
  }

  @Get(':idOrKey')
  @Roles('GV', 'ACA')
  async getOne(@Param('idOrKey') idOrKey: string) {
    return this.rlp.getTemplate(idOrKey);
  }

  @Post()
  @Roles('ACA')
  async create(@Body() body: CreateRlpTemplateDto, @Req() req: any) {
    const creatorName = req.user?.name || req.user?.email || 'Học vụ (ACA)';
    return this.rlp.createTemplate(body, creatorName);
  }

  @Put(':idOrKey')
  @Roles('ACA')
  async update(
    @Param('idOrKey') idOrKey: string,
    @Body() body: UpdateRlpTemplateDto,
  ) {
    return this.rlp.updateTemplate(idOrKey, body);
  }

  @Delete(':idOrKey')
  @Roles('ACA')
  async remove(@Param('idOrKey') idOrKey: string) {
    return this.rlp.deleteTemplate(idOrKey);
  }

  @Post(':idOrKey/apply')
  @Roles('GV', 'ACA')
  async apply(
    @Param('idOrKey') idOrKey: string,
    @Body() body: ApplyRlpTemplateDto,
  ) {
    return this.rlp.applyTemplateToClass(idOrKey, body);
  }
}
