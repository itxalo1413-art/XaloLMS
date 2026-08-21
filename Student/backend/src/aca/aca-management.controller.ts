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

  // --- Teacher Profiles ---
  @Get('teacher-profiles')
  async getAllTeacherProfiles() {
    return this.service.findAllTeacherProfiles();
  }

  @Post('teacher-profiles')
  async createTeacherProfile(@Body() data: any) {
    return this.service.createTeacherProfile(data);
  }

  @Put('teacher-profiles/:id')
  async updateTeacherProfile(@Param('id') id: string, @Body() data: any) {
    return this.service.updateTeacherProfile(id, data);
  }

  @Delete('teacher-profiles/:id')
  async deleteTeacherProfile(@Param('id') id: string) {
    return this.service.deleteTeacherProfile(id);
  }

  // --- Daily Notes & Quotes ---
  @Get('daily-notes')
  async getDailyNote() {
    return this.service.getDailyNote();
  }

  @Put('daily-notes')
  async updateDailyNote(@Body() data: any) {
    return this.service.updateDailyNote(data);
  }

  // --- Mock Test Requests ---
  @Get('mock-test-requests')
  async getAllMockTestRequests() {
    return this.service.findAllMockTestRequests();
  }

  @Post('mock-test-requests')
  async createMockTestRequest(@Body() data: any) {
    return this.service.createMockTestRequest(data);
  }

  @Put('mock-test-requests/:id')
  async updateMockTestRequest(@Param('id') id: string, @Body() data: any) {
    return this.service.updateMockTestRequest(id, data);
  }

  @Delete('mock-test-requests/:id')
  async deleteMockTestRequest(@Param('id') id: string) {
    return this.service.deleteMockTestRequest(id);
  }

  // --- Course Settings ---
  @Get('course-settings')
  async getCourseSettings() {
    return this.service.getCourseSettings();
  }

  @Put('course-settings')
  async updateCourseSettings(@Body() data: any) {
    return this.service.updateCourseSettings(data);
  }

  // --- Guest Diagnosis Leads ---
  @Get('guest-diagnosis-leads')
  async listGuestLeads() {
    return this.service.listGuestLeads();
  }

  @Post('guest-diagnosis-leads')
  async createGuestLead(@Body() body: any) {
    return this.service.createGuestLead(body ?? {});
  }

  @Get('guest-diagnosis-leads/:id')
  async getGuestLead(@Param('id') id: string) {
    return this.service.getGuestLead(id);
  }

  @Put('guest-diagnosis-leads/:id/diagnosis')
  async saveGuestLeadDiagnosis(@Param('id') id: string, @Body() body: any) {
    return this.service.saveGuestLeadDiagnosis(id, body ?? {});
  }

  @Put('guest-diagnosis-leads/:id')
  async updateGuestLead(@Param('id') id: string, @Body() body: any) {
    return this.service.updateGuestLead(id, body ?? {});
  }

  @Delete('guest-diagnosis-leads/:id')
  async deleteGuestLead(@Param('id') id: string) {
    return this.service.deleteGuestLead(id);
  }

  // --- Dashboard KPI ---
  @Get('dashboard/kpi')
  async getDashboardKpi() {
    return this.service.getDashboardKpi();
  }

  // --- Entrance Test Bookings ---
  @Get('entrance-bookings')
  async listEntranceBookings() {
    return this.service.listEntranceBookings();
  }

  @Post('entrance-bookings')
  async createEntranceBooking(@Body() body: any) {
    return this.service.createEntranceBooking(body ?? {});
  }

  @Put('entrance-bookings/:id')
  async updateEntranceBooking(@Param('id') id: string, @Body() body: any) {
    return this.service.updateEntranceBooking(id, body ?? {});
  }

  @Delete('entrance-bookings/:id')
  async deleteEntranceBooking(@Param('id') id: string) {
    return this.service.deleteEntranceBooking(id);
  }

  // --- Final Tests ---
  @Get('final-tests')
  async listFinalTests() {
    return this.service.listFinalTests();
  }

  @Post('final-tests')
  async createFinalTest(@Body() body: any) {
    return this.service.createFinalTest(body ?? {});
  }

  @Put('final-tests/:id')
  async updateFinalTest(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFinalTest(id, body ?? {});
  }

  @Put('final-tests/:id/bcb')
  async saveFinalTestBcb(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFinalTest(id, {
      bcbData: body?.bcbData ?? body ?? {},
      status: body?.status ?? 'graded',
    });
  }

  @Put('final-tests/:id/confirm')
  async confirmFinalTest(@Param('id') id: string, @Body() body: any) {
    const confirmed = body?.confirmed !== false && body?.isChecked !== false;
    const releasedBy = typeof body?.releasedBy === 'string' ? body.releasedBy : '';
    return this.service.confirmFinalTest(id, confirmed, releasedBy);
  }

  @Put('final-tests/:id/cancel')
  async cancelFinalTest(@Param('id') id: string) {
    return this.service.cancelFinalTest(id);
  }

  @Delete('final-tests/:id')
  async deleteFinalTest(@Param('id') id: string) {
    return this.service.deleteFinalTest(id);
  }

  // --- KV Store ---
  @Get('kv/:namespace')
  async getKv(@Param('namespace') namespace: string) {
    return this.service.getKv(namespace);
  }

  @Put('kv/:namespace')
  async setKv(@Param('namespace') namespace: string, @Body() body: any) {
    return this.service.setKv(namespace, body ?? {});
  }

  @Post('kv/:namespace/merge')
  async mergeKv(@Param('namespace') namespace: string, @Body() body: any) {
    return this.service.mergeKv(namespace, body ?? {});
  }
}
