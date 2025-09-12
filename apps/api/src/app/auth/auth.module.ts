import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Role, Permission } from '../../../../libs/data'; // Import entities

import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // Configure TypeORM to make User, Role, Permission repositories available
    TypeOrmModule.forFeature([User, Role, Permission]),
    // Configure Passport for authentication
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Configure JWT
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'superkey', // Use a strong secret!
      signOptions: { expiresIn: '1h' }, // Token expiration time
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController], // Add AuthController here
  exports: [AuthService, PassportModule, JwtModule], // Export for use in other modules
})
export class AuthModule {}