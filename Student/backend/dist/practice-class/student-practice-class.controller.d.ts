import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { RegisterPracticeSlotDto } from './dto/register-practice-slot.dto';
import { PracticeClassService } from './practice-class.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class StudentPracticeClassController {
    private readonly practiceClass;
    constructor(practiceClass: PracticeClassService);
    getSchedule(): Promise<import("./practice-class.service").PracticeSchedulePublic>;
    listRegistrations(req: AuthedRequest): Promise<import("./practice-class.service").PracticeRegistrationPublic[]>;
    register(req: AuthedRequest, body: RegisterPracticeSlotDto): Promise<{
        registration: import("./practice-class.service").PracticeRegistrationPublic;
    }>;
    unregister(req: AuthedRequest, slotId: string): Promise<{
        ok: boolean;
    }>;
}
export {};
