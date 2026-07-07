import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import { RlpService } from './rlp.service';
export declare class TeacherRlpController {
    private readonly rlp;
    constructor(rlp: RlpService);
    list(classId: string): Promise<import("./rlp.types").RlpSessionRecord[]>;
    update(no: number, classId: string, body: UpdateRlpSessionDto): Promise<{
        session: import("./rlp.types").RlpSessionRecord;
    }>;
}
