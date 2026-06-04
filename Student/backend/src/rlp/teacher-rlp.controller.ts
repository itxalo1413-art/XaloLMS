import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  list() {
    return this.rlp.listSessions();
  }

  @Patch(':no')
  async update(
    @Param('no', ParseIntPipe) no: number,
    @Body() body: UpdateRlpSessionDto,
  ) {
    const session = await this.rlp.updateSession(no, body ?? {});
    return { session };
  }
}
