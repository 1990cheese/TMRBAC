import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '..';

/**
 * Custom decorator to extract the authenticated user from the request object.
 * The user object is attached to the request by Passport's JwtStrategy.
 * Usage: @GetUser() user: User
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    // Ensure that req.user is properly typed by the JwtStrategy
    return request.user;
  },
);