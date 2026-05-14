import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AcaTaxonomyService } from './aca-taxonomy.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('aca/taxonomy/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ACA')
export class AcaTaxonomyController {
  constructor(private readonly taxonomy: AcaTaxonomyService) {}

  @Get()
  list() {
    return this.taxonomy.list();
  }

  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.taxonomy.create(body);
  }
}
