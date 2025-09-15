import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { User } from '../../../../libs/data';

describe('JwtStrategy Access Control', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  beforeEach(() => {
    authService = {
      validateUser: jest.fn(),
    } as any;
    strategy = new JwtStrategy(authService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user for valid payload', async () => {
    const payload = { sub: '1', email: 'user@example.com' };
    const user: Partial<User> = { id: '1', email: 'user@example.com' };
    (authService.validateUser as jest.Mock).mockResolvedValue(user);
    const result = await strategy.validate(payload);
    expect(result).toEqual(user);
  });

  it('should throw UnauthorizedException for invalid user', async () => {
    const payload = { sub: '2', email: 'nouser@example.com' };
    (authService.validateUser as jest.Mock).mockResolvedValue(null);
    await expect(strategy.validate(payload)).rejects.toThrow('Invalid token or user not found');
  });
});
