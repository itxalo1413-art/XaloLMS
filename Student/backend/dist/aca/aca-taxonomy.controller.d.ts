import { AcaTaxonomyService } from './aca-taxonomy.service';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class AcaTaxonomyController {
    private readonly taxonomy;
    constructor(taxonomy: AcaTaxonomyService);
    list(): Promise<{
        categories: import("./aca-taxonomy.service").CategoryPublic[];
    }>;
    create(body: CreateCategoryDto): Promise<{
        category: import("./aca-taxonomy.service").CategoryPublic;
    }>;
}
