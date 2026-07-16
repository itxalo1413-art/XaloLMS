"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
function getAllowedOrigins() {
    const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const fromEnv = (process.env.FRONTEND_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return new Set([...defaults, ...fromEnv]);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const allowlist = getAllowedOrigins();
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 204,
    });
    await app.listen(process.env.PORT ?? 5001);
}
bootstrap();
//# sourceMappingURL=main.js.map