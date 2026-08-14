import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
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

  @Get('registrations')
  listRegistrations() {
    return this.practiceClass.listAllRegistrationsForAca();
  }

  @Put('registration/:id')
  updateRegistrationDetails(
    @Param('id') id: string,
    @Body() body: { linkFolder?: string; scoreR?: string; scoreL?: string; scoreW?: string },
  ) {
    return this.practiceClass.updateRegistrationDetails(id, body ?? {});
  }
}
