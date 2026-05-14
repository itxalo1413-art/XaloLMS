import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentProfileService } from './student-profile.service';

@Controller('student/profile')
export class StudentProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  @Get()
  getProfile() {
    return this.studentProfileService.getProfile();
  }

  @Patch()
  updateProfile(@Body() payload: UpdateStudentProfileDto) {
    return this.studentProfileService.updateProfile(payload);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Missing avatar file.');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image file.');
    }
    return this.studentProfileService.updateAvatar(file);
  }
}
