import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { AcaClass, AcaClassDocument } from './schemas/aca-class.schema';
import { AcaStudent, AcaStudentDocument } from './schemas/aca-student.schema';
import { AcaPracticeWeek, AcaPracticeWeekDocument } from './schemas/aca-practice-week.schema';
import { AcaPracticeStudent, AcaPracticeStudentDocument } from './schemas/aca-practice-student.schema';
import { Aca11Class, Aca11ClassDocument } from './schemas/aca-11-class.schema';
import { AcaWeeklyDoc, AcaWeeklyDocDocument } from './schemas/aca-weekly-doc.schema';
import { AcaTeacherAssignment, AcaTeacherAssignmentDocument } from './schemas/aca-teacher-assignment.schema';
import { AcaFreeSlot, AcaFreeSlotDocument } from './schemas/aca-free-slot.schema';
import { AcaTeacherProfile, AcaTeacherProfileDocument } from './schemas/aca-teacher-profile.schema';
import { WritingSubmissionDocument } from '../writing-submission/schemas/writing-submission.schema';
import { RlpCourseStoreDocument } from '../rlp/schemas/rlp-course-store.schema';
import { UsersService } from '../users/users.service';
import { DailyNote, DailyNoteDocument } from './schemas/daily-note.schema';
import { MockTestRequest, MockTestRequestDocument } from './schemas/mock-test-request.schema';
import { CourseSettings, CourseSettingsDocument } from './schemas/course-settings.schema';
export declare class AcaManagementService implements OnModuleInit {
    private readonly classModel;
    private readonly studentModel;
    private readonly practiceWeekModel;
    private readonly practiceStudentModel;
    private readonly aca11Model;
    private readonly weeklyDocModel;
    private readonly teacherAssignmentModel;
    private readonly freeSlotModel;
    private readonly teacherProfileModel;
    private readonly writingSubmissionModel;
    private readonly rlpCourseStoreModel;
    private readonly dailyNoteModel;
    private readonly mockTestRequestModel;
    private readonly courseSettingsModel;
    private readonly usersService;
    constructor(classModel: Model<AcaClassDocument>, studentModel: Model<AcaStudentDocument>, practiceWeekModel: Model<AcaPracticeWeekDocument>, practiceStudentModel: Model<AcaPracticeStudentDocument>, aca11Model: Model<Aca11ClassDocument>, weeklyDocModel: Model<AcaWeeklyDocDocument>, teacherAssignmentModel: Model<AcaTeacherAssignmentDocument>, freeSlotModel: Model<AcaFreeSlotDocument>, teacherProfileModel: Model<AcaTeacherProfileDocument>, writingSubmissionModel: Model<WritingSubmissionDocument>, rlpCourseStoreModel: Model<RlpCourseStoreDocument>, dailyNoteModel: Model<DailyNoteDocument>, mockTestRequestModel: Model<MockTestRequestDocument>, courseSettingsModel: Model<CourseSettingsDocument>, usersService: UsersService);
    onModuleInit(): Promise<void>;
    private seedInitialData;
    findAllClasses(): Promise<(import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createClass(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateClass(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteClass(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaClass, {}, import("mongoose").DefaultSchemaOptions> & AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllStudents(): Promise<{
        registeredWriting: boolean;
        homeworkPercent: string;
        attendanceCount: string;
        cycles: any[];
        rawClassification: string;
        classification: string;
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        classId: string;
        stt: number;
        name: string;
        phone: string;
        email: string;
        scores: {
            l: string | number;
            r: string | number;
            w: string | number;
            s: string | number;
            o: string | number;
        };
        finalScores: {
            l: string | number;
            r: string | number;
            w: string | number;
            s: string | number;
            o: string | number;
        };
        entrance: string;
        registeredMocktest: boolean;
        registeredLuyenDe: boolean;
        registeredWriting2: boolean;
        registeredMocktest2: boolean;
        registeredLuyenDe2: boolean;
        homeworkPercent2: string;
        attendanceCount2: string;
        registeredWriting3: boolean;
        registeredMocktest3: boolean;
        registeredLuyenDe3: boolean;
        homeworkPercent3: string;
        attendanceCount3: string;
        l1: string;
        f1: string;
        l2: string;
        f2: string;
        l3: string;
        f3: string;
        bcbLink: string;
        note: string;
        dob: string;
        zodiac: string;
        avatarUrl: string;
        method: string;
        weeklyHours: string;
        classEnvironment: string;
        ieltsMeaning: string;
        previousBand: string;
        focusSkills: string[];
        practiceJoined: boolean;
        registeredSlotIds: string[];
        __v: number;
        id: string;
    }[]>;
    private ensureUserAccountForStudent;
    createStudent(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateStudent(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteStudent(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllWeeks(): Promise<(import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createWeek(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateWeek(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteWeek(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllPracticeStudents(): Promise<(import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createPracticeStudent(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updatePracticeStudent(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deletePracticeStudent(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAll11Classes(): Promise<(import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    create11Class(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update11Class(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    delete11Class(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllWeeklyDocs(): Promise<(import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createWeeklyDoc(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateWeeklyDoc(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteWeeklyDoc(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllTeacherAssignments(): Promise<(import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createTeacherAssignment(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateTeacherAssignment(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteTeacherAssignment(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllFreeSlots(): Promise<(import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createFreeSlot(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateFreeSlot(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteFreeSlot(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllTeacherProfiles(): Promise<(import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[] | (Omit<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>, "name" | "id" | "status" | "phone" | "email" | "skills" | "joinDate" | "notes"> & Omit<{
        id: string;
        name: string;
        email: string;
        phone: string;
        skills: string[];
        status: "active";
        joinDate: string;
        notes: string;
    } | {
        id: string;
        name: string;
        email: string;
        phone: string;
        skills: string[];
        status: "inactive";
        joinDate: string;
        notes: string;
    }, "_id">)[]>;
    createTeacherProfile(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateTeacherProfile(id: string, data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    deleteTeacherProfile(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getDailyNote(): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, DailyNote, {}, import("mongoose").DefaultSchemaOptions> & DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, DailyNote, {}, import("mongoose").DefaultSchemaOptions> & DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateDailyNote(data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, DailyNote, {}, import("mongoose").DefaultSchemaOptions> & DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, DailyNote, {}, import("mongoose").DefaultSchemaOptions> & DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    findAllMockTestRequests(): Promise<(import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createMockTestRequest(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateMockTestRequest(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteMockTestRequest(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getCourseSettings(): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateCourseSettings(data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
}
