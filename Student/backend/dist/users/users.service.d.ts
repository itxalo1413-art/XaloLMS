import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { type Role } from '../domain/role';
import { type UserStatus } from '../domain/user-status';
import { type UserDocument } from './schemas/user.schema';
export type PublicUser = {
    id: string;
    email: string;
    name: string;
    role: Role;
    status: UserStatus;
    createdAt: string;
};
export declare class UsersService implements OnModuleInit {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    onModuleInit(): Promise<void>;
    private normalizeEmail;
    private toPublic;
    ensureSeedAca(): Promise<void>;
    ensureSeedStudent(): Promise<void>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findPublicById(id: string): Promise<PublicUser | undefined>;
    findNamesByIds(ids: string[]): Promise<Map<string, string>>;
    listPublic(params?: {
        role?: string;
        q?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        users: PublicUser[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    validateCredentials(email: string, password: string): Promise<PublicUser | null>;
    createUser(input: {
        name: string;
        email: string;
        password: string;
        role: string;
    }): Promise<PublicUser>;
    getPublicById(id: string): Promise<PublicUser>;
    updateUser(id: string, input: {
        name?: string;
        role?: string;
        status?: string;
    }): Promise<PublicUser>;
    updatePassword(id: string, newPassword: string): Promise<void>;
}
