import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RlpService } from './rlp.service';

@Controller('student/rlp-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentRlpController {
  constructor(private readonly rlp: RlpService) {}

  @Get()
  list() {
    return this.rlp.listSessions();
  }
}
