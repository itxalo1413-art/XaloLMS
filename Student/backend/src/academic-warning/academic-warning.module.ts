import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { AcademicWarningService } from './academic-warning.service';
import { AcaAcademicWarningController } from './aca-academic-warning.controller';
import { TeacherAcademicWarningController } from './teacher-academic-warning.controller';
import { StudentAcademicWarningController } from './student-academic-warning.controller';
import {
  AcademicWarning,
  AcademicWarningSchema,
} from './schemas/academic-warning.schema';
import { AcaStudent, AcaStudentSchema } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassSchema } from '../aca/schemas/aca-class.schema';
import {
  RlpCourseStore,
  RlpCourseStoreSchema,
} from '../rlp/schemas/rlp-course-store.schema';

@Module({
  imports: [
    AuthGuardsModule,
    MongooseModule.forFeature([
      { name: AcademicWarning.name, schema: AcademicWarningSchema },
      { name: AcaStudent.name, schema: AcaStudentSchema },
      { name: AcaClass.name, schema: AcaClassSchema },
      { name: RlpCourseStore.name, schema: RlpCourseStoreSchema },
    ]),
  ],
  controllers: [
    AcaAcademicWarningController,
    TeacherAcademicWarningController,
    StudentAcademicWarningController,
  ],
  providers: [AcademicWarningService],
  exports: [AcademicWarningService],
})
export class AcademicWarningModule {}
