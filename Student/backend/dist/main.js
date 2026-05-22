"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const allowlist = new Set([
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]);
    app.enableCors({
        origin: (origin, cb) => {
            if (!origin || allowlist.has(origin)) {
                cb(null, true);
                return;
            }
            cb(new Error(`CORS blocked for origin: ${origin}`), false);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 204,
    });
    await app.listen(process.env.PORT ?? 5001);
}
bootstrap();
//# sourceMappingURL=main.js.map