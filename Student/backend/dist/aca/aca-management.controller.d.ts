import { AcaManagementService } from './aca-management.service';
export declare class AcaManagementController {
    private readonly service;
    constructor(service: AcaManagementService);
    getAllClasses(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createClass(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateClass(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteClass(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-class.schema").AcaClass, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-class.schema").AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllStudents(): Promise<{
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
    createStudent(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateStudent(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteStudent(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllWeeks(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createWeek(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateWeek(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteWeek(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-week.schema").AcaPracticeWeek, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-week.schema").AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllPracticeStudents(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createPracticeStudent(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updatePracticeStudent(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deletePracticeStudent(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-practice-student.schema").AcaPracticeStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-practice-student.schema").AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAll11Classes(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    create11Class(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update11Class(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    delete11Class(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-11-class.schema").Aca11Class, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-11-class.schema").Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllWeeklyDocs(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createWeeklyDoc(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateWeeklyDoc(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteWeeklyDoc(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-weekly-doc.schema").AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllTeacherAssignments(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createTeacherAssignment(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateTeacherAssignment(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteTeacherAssignment(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-assignment.schema").AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllFreeSlots(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createFreeSlot(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateFreeSlot(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteFreeSlot(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-free-slot.schema").AcaFreeSlot, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-free-slot.schema").AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllTeacherProfiles(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[] | (Omit<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
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
    createTeacherProfile(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateTeacherProfile(id: string, data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    deleteTeacherProfile(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-teacher-profile.schema").AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getDailyNote(): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/daily-note.schema").DailyNote, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/daily-note.schema").DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/daily-note.schema").DailyNote, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/daily-note.schema").DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateDailyNote(data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/daily-note.schema").DailyNote, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/daily-note.schema").DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/daily-note.schema").DailyNote, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/daily-note.schema").DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getAllMockTestRequests(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createMockTestRequest(data: any): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateMockTestRequest(id: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    deleteMockTestRequest(id: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/mock-test-request.schema").MockTestRequest, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/mock-test-request.schema").MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    getCourseSettings(): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/course-settings.schema").CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/course-settings.schema").CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/course-settings.schema").CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/course-settings.schema").CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateCourseSettings(data: any): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/course-settings.schema").CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/course-settings.schema").CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./schemas/course-settings.schema").CourseSettings, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/course-settings.schema").CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
}
