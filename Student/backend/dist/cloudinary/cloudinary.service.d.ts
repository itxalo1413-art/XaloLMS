export declare class CloudinaryService {
    private configured;
    constructor();
    isConfigured(): boolean;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<string>;
}
