import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AcaManagementService } from './aca-management.service';

@Controller('aca')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ACA')
export class AcaManagementController {
  constructor(private readonly service: AcaManagementService) {}

  // --- Classes ---
  @Get('classes')
  async getAllClasses() {
    return this.service.findAllClasses();
  }

  @Post('classes')
  async createClass(@Body() data: any) {
    return this.service.createClass(data);
  }

  @Put('classes/:id')
  async updateClass(@Param('id') id: string, @Body() data: any) {
    return this.service.updateClass(id, data);
  }

  @Delete('classes/:id')
  async deleteClass(@Param('id') id: string) {
    return this.service.deleteClass(id);
  }

  // --- Students ---
  @Get('students')
  async getAllStudents() {
    return this.service.findAllStudents();
  }

  @Post('students')
  async createStudent(@Body() data: any) {
    return this.service.createStudent(data);
  }

  @Put('students/:id')
  async updateStudent(@Param('id') id: string, @Body() data: any) {
    return this.service.updateStudent(id, data);
  }

  @Delete('students/:id')
  async deleteStudent(@Param('id') id: string) {
    return this.service.deleteStudent(id);
  }

  // --- Practice Weeks ---
  @Get('practice-weeks')
  async getAllWeeks() {
    return this.service.findAllWeeks();
  }

  @Post('practice-weeks')
  async createWeek(@Body() data: any) {
    return this.service.createWeek(data);
  }

  @Put('practice-weeks/:id')
  async updateWeek(@Param('id') id: string, @Body() data: any) {
    return this.service.updateWeek(id, data);
  }

  @Delete('practice-weeks/:id')
  async deleteWeek(@Param('id') id: string) {
    return this.service.deleteWeek(id);
  }

  // --- Practice Students ---
  @Get('practice-students')
  async getAllPracticeStudents() {
    return this.service.findAllPracticeStudents();
  }

  @Post('practice-students')
  async createPracticeStudent(@Body() data: any) {
    return this.service.createPracticeStudent(data);
  }

  @Put('practice-students/:id')
  async updatePracticeStudent(@Param('id') id: string, @Body() data: any) {
    return this.service.updatePracticeStudent(id, data);
  }

  @Delete('practice-students/:id')
  async deletePracticeStudent(@Param('id') id: string) {
    return this.service.deletePracticeStudent(id);
  }

  // --- 1:1 Classes ---
  @Get('11-classes')
  async getAll11Classes() {
    return this.service.findAll11Classes();
  }

  @Post('11-classes')
  async create11Class(@Body() data: any) {
    return this.service.create11Class(data);
  }

  @Put('11-classes/:id')
  async update11Class(@Param('id') id: string, @Body() data: any) {
    return this.service.update11Class(id, data);
  }

  @Delete('11-classes/:id')
  async delete11Class(@Param('id') id: string) {
    return this.service.delete11Class(id);
  }

  // --- Weekly Docs ---
  @Get('weekly-docs')
  async getAllWeeklyDocs() {
    return this.service.findAllWeeklyDocs();
  }

  @Post('weekly-docs')
  async createWeeklyDoc(@Body() data: any) {
    return this.service.createWeeklyDoc(data);
  }

  @Put('weekly-docs/:id')
  async updateWeeklyDoc(@Param('id') id: string, @Body() data: any) {
    return this.service.updateWeeklyDoc(id, data);
  }

  @Delete('weekly-docs/:id')
  async deleteWeeklyDoc(@Param('id') id: string) {
    return this.service.deleteWeeklyDoc(id);
  }

  // --- Teacher Assignments ---
  @Get('teacher-assignments')
  async getAllTeacherAssignments() {
    return this.service.findAllTeacherAssignments();
  }

  @Post('teacher-assignments')
  async createTeacherAssignment(@Body() data: any) {
    return this.service.createTeacherAssignment(data);
  }

  @Put('teacher-assignments/:id')
  async updateTeacherAssignment(@Param('id') id: string, @Body() data: any) {
    return this.service.updateTeacherAssignment(id, data);
  }

  @Delete('teacher-assignments/:id')
  async deleteTeacherAssignment(@Param('id') id: string) {
    return this.service.deleteTeacherAssignment(id);
  }

  // --- Free Slots ---
  @Get('free-slots')
  async getAllFreeSlots() {
    return this.service.findAllFreeSlots();
  }

  @Post('free-slots')
  async createFreeSlot(@Body() data: any) {
    return this.service.createFreeSlot(data);
  }

  @Put('free-slots/:id')
  async updateFreeSlot(@Param('id') id: string, @Body() data: any) {
    return this.service.updateFreeSlot(id, data);
  }

  @Delete('free-slots/:id')
  async deleteFreeSlot(@Param('id') id: string) {
    return this.service.deleteFreeSlot(id);
  }
}
