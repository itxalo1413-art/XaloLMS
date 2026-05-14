import { AcaContentService } from './aca-content.service';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateContentStatusDto } from './dto/update-content-status.dto';
export declare class AcaContentController {
    private readonly content;
    constructor(content: AcaContentService);
    list(status?: string, category?: string, q?: string, pageRaw?: string, limitRaw?: string): Promise<{
        items: import("./aca-content.service").ContentPublic[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    detail(id: string): Promise<{
        item: import("./aca-content.service").ContentPublic;
    }>;
    updateStatus(id: string, body: UpdateContentStatusDto): Promise<{
        item: import("./aca-content.service").ContentPublic;
    }>;
    update(id: string, body: UpdateContentDto): Promise<{
        item: import("./aca-content.service").ContentPublic;
    }>;
}
