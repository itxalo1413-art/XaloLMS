import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoUri } from './mongo-uri';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: getMongoUri(),
      }),
    }),
  ],
})
export class DatabaseModule {}
