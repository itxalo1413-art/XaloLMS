import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StudentProfileService } from './student-profile.service';

@Controller('aca/student-diagnosis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA', 'GV')
export class AcaStudentDiagnosisController {
  constructor(private readonly service: StudentProfileService) {}

  @Get(':email')
  getStudentDiagnosis(@Param('email') email: string) {
    return this.service.getStudentDiagnosisExtended(decodeURIComponent(email));
  }

  @Put(':email')
  saveStudentDiagnosis(
    @Param('email') email: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.saveStudentDiagnosisByEmail(
      decodeURIComponent(email),
      body,
    );
  }
}
