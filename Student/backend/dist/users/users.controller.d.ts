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
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    list(role?: string, status?: string, q?: string, pageRaw?: string, limitRaw?: string): Promise<{
        users: import("./users.service").PublicUser[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    detail(id: string): Promise<{
        user: import("./users.service").PublicUser;
    }>;
    create(body: CreateUserBody): Promise<{
        user: import("./users.service").PublicUser;
    }>;
    update(id: string, body: UpdateUserBody): Promise<{
        user: import("./users.service").PublicUser;
    }>;
    updatePassword(id: string, body: UpdatePasswordBody): Promise<{
        ok: boolean;
    }>;
}
export {};
