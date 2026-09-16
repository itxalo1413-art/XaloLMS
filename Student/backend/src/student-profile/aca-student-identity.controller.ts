import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StudentProfileService } from './student-profile.service';

@Controller('aca/student-identity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA', 'GV', 'SALE', 'GRADER')
export class AcaStudentIdentityController {
  constructor(private readonly service: StudentProfileService) {}

  @Put(':email')
  saveIdentity(
    @Param('email') email: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      dob?: string;
      zodiac?: string;
      avatarUrl?: string;
    },
  ) {
    return this.service.saveStudentIdentityByEmail(
      decodeURIComponent(email),
      body,
    );
  }
}
