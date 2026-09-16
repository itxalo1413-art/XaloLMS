import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { isAllowedAvatarImageMime } from './avatar-image.util';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentProfileService } from './student-profile.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('student/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HS')
export class StudentProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  @Get()
  getProfile(@Req() req: AuthedRequest) {
    return this.studentProfileService.getProfile(req.user.sub, {
      email: req.user.email,
      name: req.user.name,
    });
  }

  @Get('diagnosis')
  async getDiagnosis(@Req() req: AuthedRequest) {
    const profile = await this.studentProfileService.getProfile(req.user.sub, {
      email: req.user.email,
      name: req.user.name,
    });
    return this.studentProfileService.getStudentDiagnosis({
      userId: req.user.sub,
      email: req.user.email || profile.email,
      name: req.user.name || profile.name,
      phone: profile.phone,
    });
  }

  @Get('class-info')
  getClassInfo(@Req() req: AuthedRequest) {
    return this.studentProfileService.getClassInfoForStudent(req.user.email, req.user.name);
  }

  @Patch()
  updateProfile(
    @Req() req: AuthedRequest,
    @Body() payload: UpdateStudentProfileDto,
  ) {
    return this.studentProfileService.updateProfile(req.user.sub, payload, {
      email: req.user.email,
      name: req.user.name,
    });
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Missing avatar file.');
    }
    if (!isAllowedAvatarImageMime(file.mimetype)) {
      throw new BadRequestException(
        'Chỉ chấp nhận ảnh: JPEG, PNG, GIF, WebP, SVG.',
      );
    }
    return this.studentProfileService.updateAvatar(req.user.sub, file);
  }
}
