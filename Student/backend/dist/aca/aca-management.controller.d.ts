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
    getAllStudents(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/aca-student.schema").AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/aca-student.schema").AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
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
}
