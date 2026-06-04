import { GradeWritingSubmissionDto } from './dto/grade-writing-submission.dto';
import { WritingSubmissionService } from './writing-submission.service';
export declare class TeacherWritingSubmissionController {
    private readonly writing;
    constructor(writing: WritingSubmissionService);
    list(status?: string): Promise<import("./writing-submission.service").WritingSubmissionPublic[]>;
    grade(id: string, body: GradeWritingSubmissionDto): Promise<{
        submission: import("./writing-submission.service").WritingSubmissionPublic;
    }>;
}
