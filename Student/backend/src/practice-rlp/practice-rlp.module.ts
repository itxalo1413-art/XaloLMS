import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import {
  PracticeRlpStore,
  PracticeRlpStoreSchema,
} from './schemas/practice-rlp-store.schema';
import { PracticeRlpService } from './practice-rlp.service';
import { StudentPracticeRlpController } from './student-practice-rlp.controller';
import { TeacherPracticeRlpController } from './teacher-practice-rlp.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeRlpStore.name, schema: PracticeRlpStoreSchema },
    ]),
    AuthGuardsModule,
  ],
  controllers: [StudentPracticeRlpController, TeacherPracticeRlpController],
  providers: [PracticeRlpService],
  exports: [PracticeRlpService],
})
export class PracticeRlpModule {}
