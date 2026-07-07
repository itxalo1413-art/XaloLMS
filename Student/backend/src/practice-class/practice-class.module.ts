import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { UsersModule } from '../users/users.module';
import { AcaPracticeClassController } from './aca-practice-class.controller';
import { PracticeClassService } from './practice-class.service';
import {
  PracticeClassRegistration,
  PracticeClassRegistrationSchema,
} from './schemas/practice-class-registration.schema';
import {
  PracticeClassSchedule,
  PracticeClassScheduleSchema,
} from './schemas/practice-class-schedule.schema';
import { AcaPracticeStudent, AcaPracticeStudentSchema } from '../aca/schemas/aca-practice-student.schema';
import { AcaStudent, AcaStudentSchema } from '../aca/schemas/aca-student.schema';
import { StudentPracticeClassController } from './student-practice-class.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeClassSchedule.name, schema: PracticeClassScheduleSchema },
      {
        name: PracticeClassRegistration.name,
        schema: PracticeClassRegistrationSchema,
      },
      { name: AcaPracticeStudent.name, schema: AcaPracticeStudentSchema },
      { name: AcaStudent.name, schema: AcaStudentSchema },
    ]),
    AuthGuardsModule,
    UsersModule,
  ],
  controllers: [AcaPracticeClassController, StudentPracticeClassController],
  providers: [PracticeClassService],
  exports: [PracticeClassService],
})
export class PracticeClassModule {}
