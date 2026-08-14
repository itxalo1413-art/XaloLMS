import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AcaModule } from './aca/aca.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MockTestModule } from './mock-test/mock-test.module';
import { PracticeClassModule } from './practice-class/practice-class.module';
import { StudentProfileModule } from './student-profile/student-profile.module';
import { UsersModule } from './users/users.module';
import { RlpModule } from './rlp/rlp.module';
import { PracticeRlpModule } from './practice-rlp/practice-rlp.module';
import { TeacherModule } from './teacher/teacher.module';
import { WritingSubmissionModule } from './writing-submission/writing-submission.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    AcaModule,
    StudentProfileModule,
    PracticeClassModule,
    MockTestModule,
    WritingSubmissionModule,
    RlpModule,
    PracticeRlpModule,
    TeacherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
