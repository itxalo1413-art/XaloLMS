import { RlpService } from './rlp.service';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
export declare class StudentRlpController {
    private readonly rlp;
    constructor(rlp: RlpService);
    list(req: Request & {
        user: JwtPayload;
    }): Promise<import("./rlp.types").RlpSessionRecord[]>;
}
