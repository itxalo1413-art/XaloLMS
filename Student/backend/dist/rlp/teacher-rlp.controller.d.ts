import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import { RlpService } from './rlp.service';
export declare class TeacherRlpController {
    private readonly rlp;
    constructor(rlp: RlpService);
    list(): Promise<import("./rlp.types").RlpSessionRecord[]>;
    update(no: number, body: UpdateRlpSessionDto): Promise<{
        session: import("./rlp.types").RlpSessionRecord;
    }>;
}
