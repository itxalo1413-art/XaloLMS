import { RlpService } from './rlp.service';
export declare class StudentRlpController {
    private readonly rlp;
    constructor(rlp: RlpService);
    list(): Promise<import("./rlp.types").RlpSessionRecord[]>;
}
