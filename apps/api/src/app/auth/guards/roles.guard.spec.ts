import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard Access Control', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should grant access if no roles/permissions required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: {} }) }),
    };
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user is missing', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({}) }),
    };
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should grant access if user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: [{ name: 'ADMIN' }] } }) }),
    };
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: [{ name: 'USER' }] } }) }),
    };
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should grant access if user has required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['read_user']);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: [{ permissions: [{ name: 'read_user' }] }] } }) }),
    };
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['read_user']);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: [{ permissions: [{ name: 'other' }] }] } }) }),
    };
    expect(guard.canActivate(context)).toBe(false);
  });
});
