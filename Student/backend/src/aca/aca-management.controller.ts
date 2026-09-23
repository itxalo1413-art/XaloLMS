import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Public } from '../auth/public.decorator';
import { ACA_GRADER, ACA_GV, ACA_SALE, ANY_AUTH, STAFF } from '../domain/role';
import { AcaManagementService } from './aca-management.service';

@Controller('aca')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class AcaManagementController {
  constructor(private readonly service: AcaManagementService) {}

  // --- Classes ---
  @Get('classes')
  @Roles(...STAFF)
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
  @Roles(...STAFF)
  async getAllStudents() {
    return this.service.findAllStudents();
  }

  @Get('students/:id')
  @Roles(...STAFF)
  async getStudent(@Param('id') id: string) {
    return this.service.findStudentById(id);
  }

  @Post('students')
  async createStudent(@Body() data: any) {
    return this.service.createStudent(data);
  }

  @Put('students/:id')
  @Roles(...ACA_SALE)
  async updateStudent(@Param('id') id: string, @Body() data: any) {
    return this.service.updateStudent(id, data);
  }

  @Put('student-identity')
  @Roles(...STAFF)
  async saveStudentIdentity(@Body() data: any) {
    return this.service.saveStudentPortalIdentity(data);
  }

  @Delete('students/:id')
  async deleteStudent(@Param('id') id: string) {
    return this.service.deleteStudent(id);
  }

  // --- Practice Weeks ---
  @Get('practice-weeks')
  @Roles(...STAFF)
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
  @Roles(...STAFF)
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
  @Roles(...STAFF)
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
  @Roles(...STAFF)
  async getAllWeeklyDocs(
    @Query('student') student?: string,
    @Query('studentEmail') studentEmail?: string,
    @Query('className') className?: string,
    @Query('week') week?: string,
  ) {
    return this.service.findAllWeeklyDocs({ student, studentEmail, className, week });
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
  @Roles(...STAFF)
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

  // --- Free Slots (Sale xem lịch, Grader đăng ký, Học viên đặt lịch) ---
  @Get('free-slots')
  @Roles(...ANY_AUTH)
  async getAllFreeSlots() {
    return this.service.findAllFreeSlots();
  }

  @Post('free-slots')
  @Roles(...ACA_GRADER)
  async createFreeSlot(@Body() data: any) {
    return this.service.createFreeSlot(data);
  }

  @Put('free-slots/:id')
  @Roles(...ANY_AUTH)
  async updateFreeSlot(@Param('id') id: string, @Body() data: any) {
    return this.service.updateFreeSlot(id, data);
  }

  @Delete('free-slots/:id')
  @Roles(...ACA_GRADER)
  async deleteFreeSlot(@Param('id') id: string) {
    return this.service.deleteFreeSlot(id);
  }

  // --- Teacher Profiles ---
  @Get('teacher-profiles')
  @Roles(...STAFF)
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

  // --- Daily Notes (HS đọc quote) ---
  @Get('daily-notes')
  @Roles(...ANY_AUTH)
  async getDailyNote() {
    return this.service.getDailyNote();
  }

  @Put('daily-notes')
  async updateDailyNote(@Body() data: any) {
    return this.service.updateDailyNote(data);
  }

  // --- Mock Test Requests (legacy collection) ---
  @Get('mock-test-requests')
  @Roles(...STAFF)
  async getAllMockTestRequests() {
    return this.service.findAllMockTestRequests();
  }

  @Post('mock-test-requests')
  @Roles(...STAFF)
  async createMockTestRequest(@Body() data: any) {
    return this.service.createMockTestRequest(data);
  }

  @Put('mock-test-requests/:id')
  @Roles(...STAFF)
  async updateMockTestRequest(@Param('id') id: string, @Body() data: any) {
    return this.service.updateMockTestRequest(id, data);
  }

  @Delete('mock-test-requests/:id')
  @Roles(...ACA_GRADER)
  async deleteMockTestRequest(@Param('id') id: string) {
    return this.service.deleteMockTestRequest(id);
  }

  // --- Course Settings ---
  @Get('course-settings')
  @Roles(...ANY_AUTH)
  async getCourseSettings(@Query('classId') classId?: string) {
    return this.service.getCourseSettings(classId);
  }

  @Put('course-settings')
  @Roles(...ACA_GV)
  async updateCourseSettings(@Body() data: any) {
    return this.service.updateCourseSettings(data);
  }

  // --- Guest Diagnosis Leads ---
  @Get('guest-diagnosis-leads')
  @Roles(...ACA_SALE)
  async listGuestLeads() {
    return this.service.listGuestLeads();
  }

  @Public()
  @Post('guest-diagnosis-leads')
  async createGuestLead(@Body() body: any) {
    return this.service.createGuestLead(body ?? {});
  }

  /** Guest portal: xem BCB đã điền theo leadId (không lộ note/status nội bộ). */
  @Public()
  @Get('guest-diagnosis-leads/:id/public')
  async getGuestLeadPublic(@Param('id') id: string) {
    return this.service.getGuestLeadPublic(id);
  }

  @Get('guest-diagnosis-leads/:id')
  @Roles(...ACA_SALE)
  async getGuestLead(@Param('id') id: string) {
    return this.service.getGuestLead(id);
  }

  @Put('guest-diagnosis-leads/:id/diagnosis')
  @Roles(...ACA_SALE)
  async saveGuestLeadDiagnosis(@Param('id') id: string, @Body() body: any) {
    return this.service.saveGuestLeadDiagnosis(id, body ?? {});
  }

  @Put('guest-diagnosis-leads/:id')
  @Roles(...ACA_SALE)
  async updateGuestLead(@Param('id') id: string, @Body() body: any) {
    return this.service.updateGuestLead(id, body ?? {});
  }

  @Delete('guest-diagnosis-leads/:id')
  @Roles(...ACA_SALE)
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
  @Roles(...STAFF)
  async listEntranceBookings() {
    return this.service.listEntranceBookings();
  }

  @Post('entrance-bookings')
  @Roles(...ACA_SALE)
  async createEntranceBooking(@Body() body: any) {
    return this.service.createEntranceBooking(body ?? {});
  }

  @Put('entrance-bookings/:id')
  @Roles(...STAFF)
  async updateEntranceBooking(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: { user?: { role?: string } },
  ) {
    return this.service.updateEntranceBooking(id, body ?? {}, {
      role: req.user?.role,
    });
  }

  @Delete('entrance-bookings/:id')
  @Roles(...ACA_SALE)
  async deleteEntranceBooking(@Param('id') id: string) {
    return this.service.deleteEntranceBooking(id);
  }

  // --- Final Tests ---
  @Get('final-tests')
  @Roles(...ANY_AUTH)
  async listFinalTests() {
    return this.service.listFinalTests();
  }

  @Post('final-tests')
  @Roles(...ANY_AUTH)
  async createFinalTest(@Body() body: any) {
    return this.service.createFinalTest(body ?? {});
  }

  @Put('final-tests/:id')
  @Roles(...STAFF)
  async updateFinalTest(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFinalTest(id, body ?? {});
  }

  @Put('final-tests/:id/bcb')
  @Roles(...ACA_SALE)
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
  @Roles(...ACA_SALE)
  async cancelFinalTest(@Param('id') id: string) {
    return this.service.cancelFinalTest(id);
  }

  @Delete('final-tests/:id')
  async deleteFinalTest(@Param('id') id: string) {
    return this.service.deleteFinalTest(id);
  }

  // --- KV Store (Meet links, guest diagnosis cache, …) ---
  @Get('kv/:namespace')
  @Roles(...ANY_AUTH)
  async getKv(@Param('namespace') namespace: string) {
    return this.service.getKv(namespace);
  }

  @Put('kv/:namespace')
  @Roles(...STAFF)
  async setKv(@Param('namespace') namespace: string, @Body() body: any) {
    return this.service.setKv(namespace, body ?? {});
  }

  @Post('kv/:namespace/merge')
  @Roles(...STAFF)
  async mergeKv(@Param('namespace') namespace: string, @Body() body: any) {
    return this.service.mergeKv(namespace, body ?? {});
  }
}
