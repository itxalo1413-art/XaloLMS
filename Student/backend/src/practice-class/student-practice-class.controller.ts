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
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePracticeLinkFolderDto } from './dto/update-practice-link-folder.dto';
import { RegisterPracticeSlotDto } from './dto/register-practice-slot.dto';
import { PracticeClassService } from './practice-class.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('student/practice-class')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentPracticeClassController {
  constructor(private readonly practiceClass: PracticeClassService) {}

  @Get('schedule')
  getSchedule() {
    return this.practiceClass.getSchedule();
  }

  @Get('registrations')
  listRegistrations(@Req() req: AuthedRequest) {
    return this.practiceClass.listRegistrations(req.user.sub);
  }

  @Post('registrations')
  async register(
    @Req() req: AuthedRequest,
    @Body() body: RegisterPracticeSlotDto,
  ) {
    const registration = await this.practiceClass.registerSlot(
      req.user.sub,
      body?.slotId ?? '',
    );
    return { registration };
  }

  @Delete('registrations/:slotId')
  async unregister(
    @Req() req: AuthedRequest,
    @Param('slotId') slotId: string,
  ) {
    await this.practiceClass.unregisterSlot(req.user.sub, slotId);
    return { ok: true };
  }

  @Put('link-folder')
  updateLinkFolder(
    @Req() req: AuthedRequest,
    @Body() body: UpdatePracticeLinkFolderDto,
  ) {
    return this.practiceClass.updateStudentLinkFolder(
      req.user.sub,
      body?.linkFolder ?? '',
    );
  }
}
