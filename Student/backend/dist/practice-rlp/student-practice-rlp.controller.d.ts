import { PracticeRlpService } from './practice-rlp.service';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
export declare class StudentPracticeRlpController {
    private readonly svc;
    constructor(svc: PracticeRlpService);
    list(req: Request & {
        user: JwtPayload;
    }, qStudentId: string): Promise<import("../rlp/rlp.types").RlpSessionRecord[]>;
}
