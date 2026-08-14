import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { UsersService } from './users.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class UserProfileController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: AuthedRequest): Promise<{
        user: import("./users.service").PublicUser;
    }>;
    updateProfile(req: AuthedRequest, body: {
        name?: string;
        phone?: string;
        title?: string;
    }): Promise<{
        user: import("./users.service").PublicUser;
    }>;
}
export {};
