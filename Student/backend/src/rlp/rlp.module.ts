import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import {
  RlpCourseStore,
  RlpCourseStoreSchema,
} from './schemas/rlp-course-store.schema';
import {
  RlpTemplate,
  RlpTemplateSchema,
} from './schemas/rlp-template.schema';
import { RlpService } from './rlp.service';
import { StudentRlpController } from './student-rlp.controller';
import { TeacherRlpController } from './teacher-rlp.controller';
import { RlpTemplateController } from './rlp-template.controller';

import { AcaStudent, AcaStudentSchema } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassSchema } from '../aca/schemas/aca-class.schema';
import { AcademicWarningModule } from '../academic-warning/academic-warning.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RlpCourseStore.name, schema: RlpCourseStoreSchema },
      { name: RlpTemplate.name, schema: RlpTemplateSchema },
      { name: AcaStudent.name, schema: AcaStudentSchema },
      { name: AcaClass.name, schema: AcaClassSchema },
    ]),
    AuthGuardsModule,
    AcademicWarningModule,
  ],
  controllers: [StudentRlpController, TeacherRlpController, RlpTemplateController],
  providers: [RlpService],
  exports: [RlpService],
})
export class RlpModule {}

