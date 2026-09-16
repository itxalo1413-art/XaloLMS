import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { UsersModule } from '../users/users.module';
import {
  StudentProfileStore,
  StudentProfileStoreSchema,
} from './schemas/student-profile-store.schema';
import { AcaStudent, AcaStudentSchema } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassSchema } from '../aca/schemas/aca-class.schema';
import { Aca11Class, Aca11ClassSchema } from '../aca/schemas/aca-11-class.schema';
import {
  CourseSettings,
  CourseSettingsSchema,
} from '../aca/schemas/course-settings.schema';
import {
  GuestDiagnosisLead,
  GuestDiagnosisLeadSchema,
} from '../aca/schemas/guest-diagnosis-lead.schema';
import { StudentProfileController } from './student-profile.controller';
import { AcaStudentDiagnosisController } from './aca-student-diagnosis.controller';
import { AcaStudentIdentityController } from './aca-student-identity.controller';
import { StudentProfileService } from './student-profile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentProfileStore.name, schema: StudentProfileStoreSchema },
      { name: AcaStudent.name, schema: AcaStudentSchema },
      { name: AcaClass.name, schema: AcaClassSchema },
      { name: Aca11Class.name, schema: Aca11ClassSchema },
      { name: CourseSettings.name, schema: CourseSettingsSchema },
      { name: GuestDiagnosisLead.name, schema: GuestDiagnosisLeadSchema },
    ]),
    AuthGuardsModule,
    UsersModule,
  ],
  controllers: [
    StudentProfileController,
    AcaStudentDiagnosisController,
    AcaStudentIdentityController,
  ],
  providers: [StudentProfileService],
  exports: [StudentProfileService],
})
export class StudentProfileModule {}
