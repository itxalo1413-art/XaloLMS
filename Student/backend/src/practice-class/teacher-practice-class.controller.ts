import {
  Body,
  Controller,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePracticeLinkFolderDto } from './dto/update-practice-link-folder.dto';
import { UpdatePracticeSlotMaterialsDto } from './dto/update-practice-slot-materials.dto';
import { PracticeClassService } from './practice-class.service';

@Controller('teacher/practice-class')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GV', 'ACA')
export class TeacherPracticeClassController {
  constructor(private readonly practiceClass: PracticeClassService) {}

  @Put('students/:studentId/link-folder')
  updateStudentLinkFolder(
    @Param('studentId') studentId: string,
    @Body() body: UpdatePracticeLinkFolderDto,
  ) {
    return this.practiceClass.updateStudentLinkFolder(
      studentId,
      body?.linkFolder ?? '',
    );
  }

  @Put('slots/:slotId/materials')
  updateSlotMaterials(
    @Param('slotId') slotId: string,
    @Body() body: UpdatePracticeSlotMaterialsDto,
  ) {
    return this.practiceClass.updateSlotMaterials(
      slotId,
      body?.materialsUrl ?? '',
    );
  }
}
