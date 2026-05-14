import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { AcaContentController } from './aca-content.controller';
import { AcaContentService } from './aca-content.service';
import { AcaTaxonomyController } from './aca-taxonomy.controller';
import { AcaTaxonomyService } from './aca-taxonomy.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { Content, ContentSchema } from './schemas/content.schema';

@Module({
  imports: [
    AuthGuardsModule,
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [AcaContentController, AcaTaxonomyController],
  providers: [AcaContentService, AcaTaxonomyService],
})
export class AcaModule {}
