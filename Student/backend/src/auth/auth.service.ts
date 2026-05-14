import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './auth.types';
import { getJwtSecret, signAccessToken } from './jwt.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  async login(email: string, password: string) {
    const user = await this.users.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const access_token = signAccessToken(payload, getJwtSecret());
    return {
      access_token,
      user,
    };
  }
}
