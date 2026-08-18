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
import { AcaTeacherProfile, AcaTeacherProfileSchema } from './schemas/aca-teacher-profile.schema';
import { WritingSubmission, WritingSubmissionSchema } from '../writing-submission/schemas/writing-submission.schema';
import { RlpCourseStore, RlpCourseStoreSchema } from '../rlp/schemas/rlp-course-store.schema';
import { UsersModule } from '../users/users.module';
import { AcaManagementService } from './aca-management.service';
import { AcaManagementController } from './aca-management.controller';

import { DailyNote, DailyNoteSchema } from './schemas/daily-note.schema';
import { MockTestRequest, MockTestRequestSchema } from './schemas/mock-test-request.schema';
import { CourseSettings, CourseSettingsSchema } from './schemas/course-settings.schema';
import {
  GuestDiagnosisLead,
  GuestDiagnosisLeadSchema,
} from './schemas/guest-diagnosis-lead.schema';
import {
  EntranceTestBooking,
  EntranceTestBookingSchema,
} from './schemas/entrance-test-booking.schema';
import { AcaKvStore, AcaKvStoreSchema } from './schemas/aca-kv-store.schema';

@Module({
  imports: [
    AuthGuardsModule,
    UsersModule,
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
      { name: AcaTeacherProfile.name, schema: AcaTeacherProfileSchema },
      { name: WritingSubmission.name, schema: WritingSubmissionSchema },
      { name: RlpCourseStore.name, schema: RlpCourseStoreSchema },
      { name: DailyNote.name, schema: DailyNoteSchema },
      { name: MockTestRequest.name, schema: MockTestRequestSchema },
      { name: CourseSettings.name, schema: CourseSettingsSchema },
      { name: GuestDiagnosisLead.name, schema: GuestDiagnosisLeadSchema },
      { name: EntranceTestBooking.name, schema: EntranceTestBookingSchema },
      { name: AcaKvStore.name, schema: AcaKvStoreSchema },
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
