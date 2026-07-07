import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import { RlpService } from './rlp.service';

@Controller('teacher/rlp-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV')
export class TeacherRlpController {
  constructor(private readonly rlp: RlpService) {}

  @Get()
  list(@Query('classId') classId: string) {
    return this.rlp.listSessionsForClass(classId);
  }

  @Patch(':no')
  async update(
    @Param('no', ParseIntPipe) no: number,
    @Query('classId') classId: string,
    @Body() body: UpdateRlpSessionDto,
  ) {
    const session = await this.rlp.updateSessionForClass(classId, no, body ?? {});
    return { session };
  }
}
