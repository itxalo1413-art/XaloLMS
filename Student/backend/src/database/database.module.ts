import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoUri } from './mongo-uri';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: getMongoUri(),
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        maxPoolSize: 10,
        retryWrites: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
