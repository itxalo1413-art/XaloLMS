import { CreatePracticeRlpSessionDto, UpdatePracticeRlpSessionDto } from './dto/practice-rlp.dto';
import { PracticeRlpService } from './practice-rlp.service';
export declare class TeacherPracticeRlpController {
    private readonly svc;
    constructor(svc: PracticeRlpService);
    list(studentId: string): Promise<import("../rlp/rlp.types").RlpSessionRecord[]>;
    add(studentId: string, body: CreatePracticeRlpSessionDto): Promise<import("../rlp/rlp.types").RlpSessionRecord>;
    update(no: number, studentId: string, body: UpdatePracticeRlpSessionDto): Promise<{
        session: import("../rlp/rlp.types").RlpSessionRecord;
    }>;
    remove(no: number, studentId: string): Promise<{
        deleted: boolean;
    }>;
}
