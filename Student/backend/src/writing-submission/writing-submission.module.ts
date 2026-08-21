import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { UsersModule } from '../users/users.module';
import {
  WritingSubmission,
  WritingSubmissionSchema,
} from './schemas/writing-submission.schema';
import {
  EntranceTestBooking,
  EntranceTestBookingSchema,
} from '../aca/schemas/entrance-test-booking.schema';
import {
  FinalTest,
  FinalTestSchema,
} from '../aca/schemas/final-test.schema';
import { StudentWritingSubmissionController } from './student-writing-submission.controller';
import { TeacherWritingSubmissionController } from './teacher-writing-submission.controller';
import { WritingSubmissionService } from './writing-submission.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WritingSubmission.name, schema: WritingSubmissionSchema },
      { name: EntranceTestBooking.name, schema: EntranceTestBookingSchema },
      { name: FinalTest.name, schema: FinalTestSchema },
    ]),
    AuthGuardsModule,
    UsersModule,
  ],
  controllers: [
    StudentWritingSubmissionController,
    TeacherWritingSubmissionController,
  ],
  providers: [WritingSubmissionService],
  exports: [WritingSubmissionService],
})
export class WritingSubmissionModule {}
