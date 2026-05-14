import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  role: string;
};

type UpdateUserBody = {
  name?: string;
  role?: string;
  status?: string;
};

type UpdatePasswordBody = {
  password: string;
};

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const page = pageRaw ? Number(pageRaw) : 1;
    const limit = limitRaw ? Number(limitRaw) : 20;
    return this.users.listPublic({
      role,
      status,
      q,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const user = await this.users.getPublicById(id);
    return { user };
  }

  @Post()
  async create(@Body() body: CreateUserBody) {
    const user = await this.users.createUser(body);
    return { user };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserBody) {
    const user = await this.users.updateUser(id, body);
    return { user };
  }

  @Patch(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body() body: UpdatePasswordBody,
  ) {
    await this.users.updatePassword(id, body?.password ?? '');
    return { ok: true };
  }
}
