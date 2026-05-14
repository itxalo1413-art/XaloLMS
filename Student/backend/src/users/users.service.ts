import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { isRole, type Role } from '../domain/role';
import { isUserStatus, type UserStatus } from '../domain/user-status';
import { User, type UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
};

type UserLean = {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt?: Date;
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.userModel
      .updateMany(
        { status: { $exists: false } },
        { $set: { status: 'ACTIVE' } },
      )
      .exec();
    await this.ensureSeedAca();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toPublic(doc: UserLean): PublicUser {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      role: doc.role,
      status: doc.status ?? 'ACTIVE',
      createdAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
    };
  }

  async ensureSeedAca(): Promise<void> {
    const email = this.normalizeEmail(
      process.env.ACA_SEED_EMAIL ?? 'aca@xalo.internal',
    );
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) return;

    const password = process.env.ACA_SEED_PASSWORD ?? 'ChangeMe_Aca1!';
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await this.userModel.create({
      email,
      name: process.env.ACA_SEED_NAME ?? 'Quản trị ACA',
      role: 'ACA',
      status: 'ACTIVE',
      passwordHash,
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: this.normalizeEmail(email) }).exec();
  }

  async findPublicById(id: string): Promise<PublicUser | undefined> {
    if (!Types.ObjectId.isValid(id)) return undefined;
    const doc = await this.userModel.findById(id).lean<UserLean>().exec();
    if (!doc) return undefined;
    return this.toPublic(doc);
  }

  async listPublic(params?: {
    role?: string;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: PublicUser[];
    meta: { page: number; limit: number; total: number };
  }> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const query: Record<string, unknown> = {};

    if (params?.role) {
      if (!isRole(params.role)) {
        throw new BadRequestException('role phải là HS, GV hoặc ACA');
      }
      query.role = params.role;
    }
    if (params?.status) {
      if (!isUserStatus(params.status)) {
        throw new BadRequestException('status phải là ACTIVE hoặc INACTIVE');
      }
      if (params.status === 'ACTIVE') {
        const currentOr = Array.isArray(query.$or)
          ? (query.$or as Record<string, unknown>[])
          : [];
        query.$or = [
          ...currentOr,
          { status: 'ACTIVE' },
          { status: { $exists: false } },
        ];
      } else {
        query.status = params.status;
      }
    }
    if (params?.q?.trim()) {
      const keyword = params.q.trim();
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<UserLean[]>()
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return {
      users: rows.map((doc) => this.toPublic(doc)),
      meta: { page, limit, total },
    };
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    if (user.status !== 'ACTIVE') return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    const lean = user.toObject() as UserLean;
    return this.toPublic(lean);
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<PublicUser> {
    const name = input.name?.trim();
    const emailRaw = input.email?.trim();
    const password = input.password ?? '';

    if (!name) {
      throw new BadRequestException('Tên không được để trống');
    }
    if (!emailRaw || !emailRaw.includes('@')) {
      throw new BadRequestException('Email không hợp lệ');
    }
    if (password.length < 8) {
      throw new BadRequestException('Mật khẩu cần ít nhất 8 ký tự');
    }
    if (!isRole(input.role)) {
      throw new BadRequestException('Vai trò phải là HS, GV hoặc ACA');
    }

    const email = this.normalizeEmail(emailRaw);
    const dup = await this.userModel.findOne({ email }).exec();
    if (dup) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const role = input.role;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const created = await this.userModel.create({
      email,
      name,
      role,
      status: 'ACTIVE',
      passwordHash,
    });
    return this.toPublic(created.toObject());
  }

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.findPublicById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return user;
  }

  async updateUser(
    id: string,
    input: { name?: string; role?: string; status?: string },
  ): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy user');
    }
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException('Tên không được để trống');
      }
      payload.name = name;
    }
    if (input.role !== undefined) {
      if (!isRole(input.role)) {
        throw new BadRequestException('Vai trò phải là HS, GV hoặc ACA');
      }
      payload.role = input.role;
    }
    if (input.status !== undefined) {
      if (!isUserStatus(input.status)) {
        throw new BadRequestException('status phải là ACTIVE hoặc INACTIVE');
      }
      payload.status = input.status;
    }
    if (!Object.keys(payload).length) {
      throw new BadRequestException('Không có dữ liệu cập nhật hợp lệ');
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .lean<UserLean>()
      .exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return this.toPublic(updated);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy user');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('Mật khẩu cần ít nhất 8 ký tự');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: { passwordHash } }, { new: true })
      .select('_id')
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy user');
    }
  }
}
