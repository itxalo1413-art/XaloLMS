import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { RecordMockTestResultDto } from './dto/record-mock-test-result.dto';
import { MockTestService } from './mock-test.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class TeacherMockTestController {
    private readonly mockTests;
    constructor(mockTests: MockTestService);
    listSpeaking(req: AuthedRequest, teacherName?: string): Promise<import("./mock-test.service").MockTestRequestPublic[]>;
    recordResult(req: AuthedRequest, id: string, body: RecordMockTestResultDto): Promise<{
        request: import("./mock-test.service").MockTestRequestPublic;
    }>;
}
export {};
