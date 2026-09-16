import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRlpSessionDto } from './dto/create-rlp-session.dto';
import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import { RlpService } from './rlp.service';

@Controller('teacher/rlp-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA', 'GRADER')
export class TeacherRlpController {
  constructor(private readonly rlp: RlpService) {}

  @Get()
  list(@Query('classId') classId: string) {
    if (!String(classId || '').trim()) {
      throw new BadRequestException('Thiếu classId');
    }
    return this.rlp.listSessionsForClass(classId);
  }

  @Post()
  async add(
    @Query('classId') classId: string,
    @Body() body: CreateRlpSessionDto,
  ) {
    if (!String(classId || '').trim()) {
      throw new BadRequestException('Thiếu classId');
    }
    const session = await this.rlp.addSessionForClass(classId, body ?? {});
    return { session };
  }

  @Patch(':no')
  async update(
    @Param('no', ParseIntPipe) no: number,
    @Query('classId') classId: string,
    @Body() body: UpdateRlpSessionDto,
  ) {
    if (!String(classId || '').trim()) {
      throw new BadRequestException('Thiếu classId');
    }
    const session = await this.rlp.updateSessionForClass(classId, no, body ?? {});
    return { session };
  }

  @Delete(':no')
  remove(
    @Param('no', ParseIntPipe) no: number,
    @Query('classId') classId: string,
  ) {
    if (!String(classId || '').trim()) {
      throw new BadRequestException('Thiếu classId');
    }
    return this.rlp.deleteSessionForClass(classId, no);
  }
}
