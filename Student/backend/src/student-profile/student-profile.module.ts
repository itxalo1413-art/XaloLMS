import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StudentProfileStore,
  StudentProfileStoreSchema,
} from './schemas/student-profile-store.schema';
import { StudentProfileController } from './student-profile.controller';
import { StudentProfileService } from './student-profile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentProfileStore.name, schema: StudentProfileStoreSchema },
    ]),
  ],
  controllers: [StudentProfileController],
  providers: [StudentProfileService],
  exports: [StudentProfileService],
})
export class StudentProfileModule {}
