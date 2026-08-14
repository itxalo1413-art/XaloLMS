import { UpdatePracticeScheduleDto } from './dto/update-practice-schedule.dto';
import { PracticeClassService } from './practice-class.service';
export declare class AcaPracticeClassController {
    private readonly practiceClass;
    constructor(practiceClass: PracticeClassService);
    getSchedule(): Promise<import("./practice-class.service").PracticeSchedulePublic>;
    updateSchedule(body: UpdatePracticeScheduleDto): Promise<import("./practice-class.service").PracticeSchedulePublic>;
    listRegistrations(): Promise<import("./practice-class.service").PracticeRegistrationAcaPublic[]>;
    updateRegistrationDetails(id: string, body: {
        linkFolder?: string;
        scoreR?: string;
        scoreL?: string;
        scoreW?: string;
    }): Promise<import("./practice-class.service").PracticeRegistrationAcaPublic>;
}
