import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePracticeScheduleDto } from './dto/update-practice-schedule.dto';
import { PracticeClassService } from './practice-class.service';

@Controller('aca/practice-class')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class AcaPracticeClassController {
  constructor(private readonly practiceClass: PracticeClassService) {}

  @Get('schedule')
  getSchedule() {
    return this.practiceClass.getSchedule();
  }

  @Put('schedule')
  updateSchedule(@Body() body: UpdatePracticeScheduleDto) {
    return this.practiceClass.updateSchedule(body ?? {});
  }
}
