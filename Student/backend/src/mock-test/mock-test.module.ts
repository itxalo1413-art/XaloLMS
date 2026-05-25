import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { UsersModule } from '../users/users.module';
import { AcaMockTestController } from './aca-mock-test.controller';
import { MockTestService } from './mock-test.service';
import {
  MockTestRequest,
  MockTestRequestSchema,
} from './schemas/mock-test-request.schema';
import { StudentMockTestController } from './student-mock-test.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MockTestRequest.name, schema: MockTestRequestSchema },
    ]),
    AuthGuardsModule,
    UsersModule,
  ],
  controllers: [StudentMockTestController, AcaMockTestController],
  providers: [MockTestService],
  exports: [MockTestService],
})
export class MockTestModule {}
