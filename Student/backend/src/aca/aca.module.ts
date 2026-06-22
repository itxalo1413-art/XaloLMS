import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { AcaContentController } from './aca-content.controller';
import { AcaContentService } from './aca-content.service';
import { AcaTaxonomyController } from './aca-taxonomy.controller';
import { AcaTaxonomyService } from './aca-taxonomy.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { Content, ContentSchema } from './schemas/content.schema';

import { AcaClass, AcaClassSchema } from './schemas/aca-class.schema';
import { AcaStudent, AcaStudentSchema } from './schemas/aca-student.schema';
import { AcaPracticeWeek, AcaPracticeWeekSchema } from './schemas/aca-practice-week.schema';
import { AcaPracticeStudent, AcaPracticeStudentSchema } from './schemas/aca-practice-student.schema';
import { Aca11Class, Aca11ClassSchema } from './schemas/aca-11-class.schema';
import { AcaWeeklyDoc, AcaWeeklyDocSchema } from './schemas/aca-weekly-doc.schema';
import { AcaTeacherAssignment, AcaTeacherAssignmentSchema } from './schemas/aca-teacher-assignment.schema';
import { AcaFreeSlot, AcaFreeSlotSchema } from './schemas/aca-free-slot.schema';
import { AcaManagementService } from './aca-management.service';
import { AcaManagementController } from './aca-management.controller';

@Module({
  imports: [
    AuthGuardsModule,
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: Category.name, schema: CategorySchema },
      { name: AcaClass.name, schema: AcaClassSchema },
      { name: AcaStudent.name, schema: AcaStudentSchema },
      { name: AcaPracticeWeek.name, schema: AcaPracticeWeekSchema },
      { name: AcaPracticeStudent.name, schema: AcaPracticeStudentSchema },
      { name: Aca11Class.name, schema: Aca11ClassSchema },
      { name: AcaWeeklyDoc.name, schema: AcaWeeklyDocSchema },
      { name: AcaTeacherAssignment.name, schema: AcaTeacherAssignmentSchema },
      { name: AcaFreeSlot.name, schema: AcaFreeSlotSchema },
    ]),
  ],
  controllers: [
    AcaContentController,
    AcaTaxonomyController,
    AcaManagementController,
  ],
  providers: [
    AcaContentService,
    AcaTaxonomyService,
    AcaManagementService,
  ],
})
export class AcaModule {}
