import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { User, UserSchema } from './schemas/user.schema';
import { UserProfileController } from './user-profile.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthGuardsModule,
  ],
  controllers: [UsersController, UserProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
