import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePracticeLinkFolderDto } from './dto/update-practice-link-folder.dto';
import { UpdatePracticeScheduleDto } from './dto/update-practice-schedule.dto';
import { UpdatePracticeZoomDto } from './dto/update-practice-zoom.dto';
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

  @Put('zoom')
  updateZoom(@Body() body: UpdatePracticeZoomDto) {
    return this.practiceClass.updateZoom(body ?? {});
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

  @Put('students/:studentId/link-folder')
  updateStudentLinkFolder(
    @Param('studentId') studentId: string,
    @Body() body: UpdatePracticeLinkFolderDto,
  ) {
    return this.practiceClass.updateStudentLinkFolder(
      studentId,
      body?.linkFolder ?? '',
    );
  }
}
