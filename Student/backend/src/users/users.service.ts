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
  phone?: string;
  title?: string;
  createdAt: string;
};

type UserLean = {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  title?: string;
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
    await this.ensureSeedStudent();
    await this.ensureSeedTeachers();
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
      phone: doc.phone ?? '',
      title: doc.title ?? '',
      createdAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
    };
  }

  async getProfileByUserId(userId: string): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }
    const doc = await this.userModel.findById(userId).lean().exec();
    if (!doc) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(doc as UserLean);
  }

  async updateProfileByUserId(
    userId: string,
    payload: { name?: string; phone?: string; title?: string },
  ): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.phone !== undefined) updateData.phone = payload.phone.trim();
    if (payload.title !== undefined) updateData.title = payload.title.trim();

    const doc = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .lean()
      .exec();

    if (!doc) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(doc as UserLean);
  }

  async ensureSeedAca(): Promise<void> {
    const acaAccounts = [
      { name: "Bộ phận Học vụ (ACA 1)", email: "aca_1@gmail.com" },
      { name: "Bộ phận Học vụ (ACA 2)", email: "aca_2@gmail.com" },
      { name: "Quản lý Học vụ", email: "aca@xaloenglish.vn" },
      { name: "Học vụ Hệ thống", email: "aca@xalo.internal" },
    ];
    const passwordHash = await bcrypt.hash("test@123!", SALT_ROUNDS);

    for (const a of acaAccounts) {
      const email = this.normalizeEmail(a.email);
      const existing = await this.userModel.findOne({ email }).exec();
      if (!existing) {
        await this.userModel.create({
          email,
          name: a.name,
          role: "ACA",
          status: "ACTIVE",
          passwordHash,
        });
      } else {
        await this.userModel.updateOne(
          { email },
          { $set: { name: a.name, role: "ACA", status: "ACTIVE", passwordHash } },
        ).exec();
      }
    }
  }

  async ensureSeedStudent(): Promise<void> {
    const email = this.normalizeEmail(
      process.env.STUDENT_SEED_EMAIL ?? 'nguyenduong939705@gmail.com',
    );
    const password = process.env.STUDENT_SEED_PASSWORD ?? 'Student@123!';
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const existing = await this.userModel.findOne({ email }).exec();
    if (!existing) {
      await this.userModel.create({
        email,
        name: process.env.STUDENT_SEED_NAME ?? 'Dương Ngọc Khôi Nguyên',
        role: 'HS',
        status: 'ACTIVE',
        passwordHash,
      });
    } else {
      await this.userModel.updateOne(
        { email },
        {
          $set: {
            name: process.env.STUDENT_SEED_NAME ?? 'Dương Ngọc Khôi Nguyên',
            role: 'HS',
            status: 'ACTIVE',
            passwordHash,
          },
        },
      ).exec();
    }
  }

  async ensureSeedTeachers(): Promise<void> {
    const defaultTeachers = [
      { name: 'Lê Nguyễn Khánh Thi', email: 'khanhthi.le@xalo.edu.vn' },
      { name: 'Lê Thị Diệu Linh', email: 'dieulinh.le@xalo.edu.vn' },
      { name: 'Nghiêm Doãn Quỳnh Châu', email: 'quynhchau.nghiem@xalo.edu.vn' },
      { name: 'Lê Minh Trang', email: 'minhtrang.le@xalo.edu.vn' },
      { name: 'Phạm Hoàng An', email: 'hoangan.pham@xalo.edu.vn' },
      { name: 'Trần Thu Lan', email: 'thulan.tran@xalo.edu.vn' },
      { name: 'Lê Thanh Tâm', email: 'thanhtam.le@xalo.edu.vn' },
      { name: 'Thái Đỗ Đăng Khoa', email: 'dangkhoa.thai@xalo.edu.vn' },
      { name: 'Tất Duy Khải', email: 'duykhai.tat@xalo.edu.vn' },
      { name: 'Lê Như Hải', email: 'nhuhai.le@xalo.edu.vn' },
      { name: 'Nguyễn Lê Trung Dũng', email: 'trungdung.nguyen@xalo.edu.vn' },
      { name: 'Nguyễn Lưu Minh Tâm', email: 'minhtam.nguyen@xalo.edu.vn' },
      { name: 'Trần Quang Minh', email: 'quangminh.tran@xalo.edu.vn' },
      { name: 'Đặng Duy', email: 'dangduy@xalo.edu.vn' },
    ];

    const defaultPasswordHash = await bcrypt.hash('Teacher@123!', SALT_ROUNDS);

    for (const t of defaultTeachers) {
      const email = this.normalizeEmail(t.email);
      const existing = await this.userModel.findOne({ email }).exec();
      if (!existing) {
        await this.userModel.create({
          email,
          name: t.name,
          role: 'GV',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
        });
      } else {
        await this.userModel.updateOne(
          { email },
          {
            $set: {
              name: t.name,
              role: 'GV',
              status: 'ACTIVE',
              passwordHash: defaultPasswordHash,
            },
          },
        ).exec();
      }
    }
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

  async findNamesByIds(ids: string[]): Promise<Map<string, string>> {
    const valid = [...new Set(ids.filter((id) => Types.ObjectId.isValid(id)))];
    const map = new Map<string, string>();
    if (valid.length === 0) return map;
    const rows = await this.userModel
      .find({ _id: { $in: valid.map((id) => new Types.ObjectId(id)) } })
      .select({ name: 1 })
      .lean<{ _id: Types.ObjectId; name: string }[]>()
      .exec();
    for (const row of rows) {
      map.set(row._id.toString(), row.name);
    }
    return map;
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
      .findByIdAndUpdate(id, { $set: payload }, { returnDocument: 'after' })
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
      .findByIdAndUpdate(id, { $set: { passwordHash } }, { returnDocument: 'after' })
      .select('_id')
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy user');
    }
  }
}
