import type { Request } from 'express';
import type { JwtPayload } from './auth.types';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
type LoginBody = {
    email: string;
    password: string;
};
export declare class AuthController {
    private readonly auth;
    private readonly users;
    constructor(auth: AuthService, users: UsersService);
    login(body: LoginBody): Promise<{
        access_token: string;
        user: import("../users/users.service").PublicUser;
    }>;
    me(req: Request & {
        user: JwtPayload;
    }): Promise<{
        user: {
            id: string;
            sub: string;
            email: string;
            role: import("../domain/role").Role;
            name: string;
        };
    } | {
        user: import("../users/users.service").PublicUser;
    }>;
}
export {};
