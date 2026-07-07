import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import {
  RlpCourseStore,
  RlpCourseStoreSchema,
} from './schemas/rlp-course-store.schema';
import { RlpService } from './rlp.service';
import { StudentRlpController } from './student-rlp.controller';
import { TeacherRlpController } from './teacher-rlp.controller';

import { AcaStudent, AcaStudentSchema } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassSchema } from '../aca/schemas/aca-class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RlpCourseStore.name, schema: RlpCourseStoreSchema },
      { name: AcaStudent.name, schema: AcaStudentSchema },
      { name: AcaClass.name, schema: AcaClassSchema },
    ]),
    AuthGuardsModule,
  ],
  controllers: [StudentRlpController, TeacherRlpController],
  providers: [RlpService],
  exports: [RlpService],
})
export class RlpModule {}
