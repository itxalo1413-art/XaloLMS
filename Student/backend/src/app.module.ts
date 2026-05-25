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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
