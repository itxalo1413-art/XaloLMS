import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UpdatePracticeScheduleDto } from './dto/update-practice-schedule.dto';
import { type PracticeSlotDefinition, type PracticeSlotId } from './practice-class.constants';
import { type PracticeClassRegistrationDocument } from './schemas/practice-class-registration.schema';
import { type PracticeClassScheduleDocument } from './schemas/practice-class-schedule.schema';
export type PracticeClassSlotPublic = PracticeSlotDefinition & {
    dateNote?: string;
};
export type PracticeSchedulePublic = {
    weekRangeLabel: string;
    updatedAt: string | null;
    slots: PracticeClassSlotPublic[];
};
export type PracticeRegistrationPublic = {
    slotId: PracticeSlotId;
    registeredAt: string;
};
export type PracticeRegistrationAcaPublic = {
    studentId: string;
    studentName: string;
    slotId: PracticeSlotId;
    slotTitle: string;
    slotSchedule: string;
    registeredAt: string;
};
export declare class PracticeClassService {
    private readonly scheduleModel;
    private readonly registrationModel;
    private readonly usersService;
    constructor(scheduleModel: Model<PracticeClassScheduleDocument>, registrationModel: Model<PracticeClassRegistrationDocument>, usersService: UsersService);
    private mergeSlot;
    private buildScheduleResponse;
    getSchedule(): Promise<PracticeSchedulePublic>;
    updateSchedule(payload: UpdatePracticeScheduleDto): Promise<PracticeSchedulePublic>;
    listRegistrations(userId: string): Promise<PracticeRegistrationPublic[]>;
    registerSlot(userId: string, slotId: string): Promise<PracticeRegistrationPublic>;
    listAllRegistrationsForAca(): Promise<PracticeRegistrationAcaPublic[]>;
    unregisterSlot(userId: string, slotId: string): Promise<void>;
}
