import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from './auth.types';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';

type LoginBody = {
  email: string;
  password: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('login')
  login(@Body() body: LoginBody) {
    const email = body?.email ?? '';
    const password = body?.password ?? '';
    return this.auth.login(email, password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user: JwtPayload }) {
    const fresh = await this.users.findPublicById(req.user.sub);
    if (!fresh) {
      return { user: { ...req.user, id: req.user.sub } };
    }
    return { user: fresh };
  }
}
