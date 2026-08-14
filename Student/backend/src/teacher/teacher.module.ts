import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import {
  TeacherAttendance,
  TeacherAttendanceSchema,
} from './schemas/teacher-attendance.schema';
import { TeacherAttendanceController } from './teacher-attendance.controller';
import { TeacherAttendanceService } from './teacher-attendance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherAttendance.name, schema: TeacherAttendanceSchema },
    ]),
    AuthGuardsModule,
  ],
  controllers: [TeacherAttendanceController],
  providers: [TeacherAttendanceService],
  exports: [TeacherAttendanceService],
})
export class TeacherModule {}
