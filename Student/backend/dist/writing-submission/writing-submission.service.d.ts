import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { GradeWritingSubmissionDto } from './dto/grade-writing-submission.dto';
import { type WritingSubmissionStatus } from './writing-submission.constants';
import { type WritingSubmissionDocument } from './schemas/writing-submission.schema';
export type WritingSubmissionPublic = {
    id: string;
    studentId: string;
    studentName: string;
    examLink: string;
    testDateTime: string;
    submittedAt: string;
    status: WritingSubmissionStatus;
    score?: string;
    gradedAt?: string;
};
export declare class WritingSubmissionService {
    private readonly model;
    private readonly users;
    constructor(model: Model<WritingSubmissionDocument>, users: UsersService);
    private toPublic;
    private findByIdOrThrow;
    private resolveStudentName;
    listForStudent(studentId: string): Promise<WritingSubmissionPublic[]>;
    listForTeacher(status?: string): Promise<WritingSubmissionPublic[]>;
    createForStudent(studentId: string, studentName: string | undefined, payload: CreateWritingSubmissionDto): Promise<WritingSubmissionPublic>;
    grade(id: string, payload: GradeWritingSubmissionDto): Promise<WritingSubmissionPublic>;
}
