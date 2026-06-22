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
export declare class AcaManagementService implements OnModuleInit {
    private readonly classModel;
    private readonly studentModel;
    private readonly practiceWeekModel;
    private readonly practiceStudentModel;
    private readonly aca11Model;
    private readonly weeklyDocModel;
    private readonly teacherAssignmentModel;
    private readonly freeSlotModel;
    constructor(classModel: Model<AcaClassDocument>, studentModel: Model<AcaStudentDocument>, practiceWeekModel: Model<AcaPracticeWeekDocument>, practiceStudentModel: Model<AcaPracticeStudentDocument>, aca11Model: Model<Aca11ClassDocument>, weeklyDocModel: Model<AcaWeeklyDocDocument>, teacherAssignmentModel: Model<AcaTeacherAssignmentDocument>, freeSlotModel: Model<AcaFreeSlotDocument>);
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
    findAllStudents(): Promise<(import("mongoose").Document<unknown, {}, AcaStudent, {}, import("mongoose").DefaultSchemaOptions> & AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
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
}
