import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { UsersModule } from '../users/users.module';
import {
  EntranceTestBooking,
  EntranceTestBookingSchema,
} from '../aca/schemas/entrance-test-booking.schema';
import {
  FinalTest,
  FinalTestSchema,
} from '../aca/schemas/final-test.schema';
import { AcaMockTestController } from './aca-mock-test.controller';
import { MockTestService } from './mock-test.service';
import {
  MockTestRequest,
  MockTestRequestSchema,
} from './schemas/mock-test-request.schema';
import { StudentMockTestController } from './student-mock-test.controller';
import { TeacherMockTestController } from './teacher-mock-test.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MockTestRequest.name, schema: MockTestRequestSchema },
      { name: EntranceTestBooking.name, schema: EntranceTestBookingSchema },
      { name: FinalTest.name, schema: FinalTestSchema },
    ]),
    AuthGuardsModule,
    UsersModule,
  ],
  controllers: [
    StudentMockTestController,
    AcaMockTestController,
    TeacherMockTestController,
  ],
  providers: [MockTestService],
  exports: [MockTestService],
})
export class MockTestModule {}
