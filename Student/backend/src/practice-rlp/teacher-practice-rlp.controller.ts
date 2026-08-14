import {
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
import {
  CreatePracticeRlpSessionDto,
  UpdatePracticeRlpSessionDto,
} from './dto/practice-rlp.dto';
import { PracticeRlpService } from './practice-rlp.service';

/**
 * Teacher/ACA-only endpoints.
 * Only accounts with role GV or ACA can access these.
 * On the frontend, we further restrict to Thanh Tâm (GV) and Khánh Thi (ACA).
 */
@Controller('teacher/practice-rlp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA')
export class TeacherPracticeRlpController {
  constructor(private readonly svc: PracticeRlpService) {}

  /** GET /api/teacher/practice-rlp?studentId=xxx */
  @Get()
  list(@Query('studentId') studentId: string) {
    return this.svc.listSessions(studentId);
  }

  /** POST /api/teacher/practice-rlp?studentId=xxx */
  @Post()
  add(
    @Query('studentId') studentId: string,
    @Body() body: CreatePracticeRlpSessionDto,
  ) {
    return this.svc.addSession(studentId, body);
  }

  /** PATCH /api/teacher/practice-rlp/:no?studentId=xxx */
  @Patch(':no')
  async update(
    @Param('no', ParseIntPipe) no: number,
    @Query('studentId') studentId: string,
    @Body() body: UpdatePracticeRlpSessionDto,
  ) {
    const session = await this.svc.updateSession(studentId, no, body ?? {});
    return { session };
  }

  /** DELETE /api/teacher/practice-rlp/:no?studentId=xxx */
  @Delete(':no')
  remove(
    @Param('no', ParseIntPipe) no: number,
    @Query('studentId') studentId: string,
  ) {
    return this.svc.deleteSession(studentId, no);
  }
}
