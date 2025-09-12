import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { User } from '../../../../libs/data';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
      ignoreExpiration: false, // Do not ignore token expiration
      secretOrKey: process.env['JWT_SECRET'] || 'supersecretkey', // Same secret as in AuthModule
    });
  }

  /**
   * Validates the JWT payload and returns the authenticated user.
   * @param payload The decoded JWT payload.
   * @returns The authenticated user.
   * @throws UnauthorizedException if the user is not found or invalid.
   */
  async validate(payload: any): Promise<User> {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
    return user;
  }
}