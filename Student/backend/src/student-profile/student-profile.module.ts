import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { UsersModule } from '../users/users.module';
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
    AuthGuardsModule,
    UsersModule,
  ],
  controllers: [StudentProfileController],
  providers: [StudentProfileService],
  exports: [StudentProfileService],
})
export class StudentProfileModule {}
