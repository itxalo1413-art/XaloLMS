import { ReviewMockTestDto } from './dto/review-mock-test.dto';
import { MockTestService } from './mock-test.service';
export declare class AcaMockTestController {
    private readonly mockTests;
    constructor(mockTests: MockTestService);
    list(status?: string): Promise<import("./mock-test.service").MockTestRequestPublic[]>;
    approve(id: string, body: ReviewMockTestDto): Promise<{
        request: import("./mock-test.service").MockTestRequestPublic;
    }>;
    reject(id: string): Promise<{
        request: import("./mock-test.service").MockTestRequestPublic;
    }>;
}
