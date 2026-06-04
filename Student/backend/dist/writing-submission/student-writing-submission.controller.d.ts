import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { WritingSubmissionService } from './writing-submission.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class StudentWritingSubmissionController {
    private readonly writing;
    constructor(writing: WritingSubmissionService);
    listMine(req: AuthedRequest): Promise<import("./writing-submission.service").WritingSubmissionPublic[]>;
    create(req: AuthedRequest, body: CreateWritingSubmissionDto): Promise<{
        submission: import("./writing-submission.service").WritingSubmissionPublic;
    }>;
}
export {};
