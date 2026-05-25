import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { CreateMockTestDto } from './dto/create-mock-test.dto';
import { MockTestService } from './mock-test.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class StudentMockTestController {
    private readonly mockTests;
    constructor(mockTests: MockTestService);
    listMine(req: AuthedRequest): Promise<import("./mock-test.service").MockTestRequestPublic[]>;
    create(req: AuthedRequest, body: CreateMockTestDto): Promise<{
        request: import("./mock-test.service").MockTestRequestPublic;
    }>;
    cancel(req: AuthedRequest, id: string): Promise<{
        ok: boolean;
    }>;
}
export {};
