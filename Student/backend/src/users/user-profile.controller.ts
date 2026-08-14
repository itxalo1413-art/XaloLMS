import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { UsersService } from './users.service';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('user/profile')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@Req() req: AuthedRequest) {
    const user = await this.usersService.getProfileByUserId(req.user.sub);
    return { user };
  }

  @Patch()
  async updateProfile(
    @Req() req: AuthedRequest,
    @Body() body: { name?: string; phone?: string; title?: string },
  ) {
    const user = await this.usersService.updateProfileByUserId(
      req.user.sub,
      body,
    );
    return { user };
  }
}
