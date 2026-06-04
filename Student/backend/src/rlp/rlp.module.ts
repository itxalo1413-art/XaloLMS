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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RlpCourseStore.name, schema: RlpCourseStoreSchema },
    ]),
    AuthGuardsModule,
  ],
  controllers: [StudentRlpController, TeacherRlpController],
  providers: [RlpService],
  exports: [RlpService],
})
export class RlpModule {}
