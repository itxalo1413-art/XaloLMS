import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly users;
    constructor(users: UsersService);
    login(email: string, password: string): Promise<{
        access_token: string;
        user: import("../users/users.service").PublicUser;
    }>;
}
