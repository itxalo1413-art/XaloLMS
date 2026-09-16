import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StudentProfileService } from './student-profile.service';

@Controller('aca/student-diagnosis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA', 'SALE')
export class AcaStudentDiagnosisController {
  constructor(private readonly service: StudentProfileService) {}

  @Get()
  getByQuery(
    @Query('email') email?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.service.getStudentDiagnosisExtended(
      decodeURIComponent(email || ''),
      studentId ? decodeURIComponent(studentId) : undefined,
    );
  }

  @Put()
  saveByBody(
    @Body()
    body: Record<string, unknown> & { email?: string; studentId?: string },
  ) {
    return this.service.saveStudentDiagnosis(
      {
        email: String(body.email || ''),
        studentId: String(body.studentId || ''),
        name: String(
          (body as { studentName?: string }).studentName || body.name || '',
        ),
        phone: String(
          (body as { studentPhone?: string }).studentPhone || body.phone || '',
        ),
      },
      body,
    );
  }

  @Get(':email')
  getStudentDiagnosis(@Param('email') email: string) {
    return this.service.getStudentDiagnosisExtended(decodeURIComponent(email));
  }

  @Put(':email')
  saveStudentDiagnosis(
    @Param('email') email: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.saveStudentDiagnosis(
      {
        email: decodeURIComponent(email),
        studentId: String(body.studentId || ''),
        name: String(
          (body as { studentName?: string }).studentName || body.name || '',
        ),
        phone: String(
          (body as { studentPhone?: string }).studentPhone || body.phone || '',
        ),
      },
      body,
    );
  }
}
