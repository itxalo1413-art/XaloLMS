import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoUri } from './mongo-uri';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: getMongoUri(),
        serverSelectionTimeoutMS: 30_000,
        connectTimeoutMS: 30_000,
        socketTimeoutMS: 45_000,
        family: 4,
        maxPoolSize: 10,
        retryWrites: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
