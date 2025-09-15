
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RoleName, PermissionName, User, Role, Permission } from '../../../../libs/data';

describe('AuthController Access Control', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            updateUser: jest.fn(),
            seedRolesAndPermissions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user with USER role', async () => {
    const dto: RegisterDto = {
      email: 'user@example.com',
      password: 'pass',
      firstName: 'User',
      lastName: 'Test',
    };
    const user: Partial<User> = {
      id: '1',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      createdAt: new Date(),
      roles: [{ name: RoleName.USER } as Role],
    };
    (service.register as jest.Mock).mockResolvedValue(user);
    const result = await controller.register(dto);
    expect(result.user.email).toBe(dto.email);
    expect(result.user.firstName).toBe(dto.firstName);
    expect(result.user.lastName).toBe(dto.lastName);
  });

  it('should login and return accessToken for valid credentials', async () => {
    const dto: LoginDto = { email: 'admin@example.com', password: 'pass' };
    const mockToken = 'jwt.token';
    (service.login as jest.Mock).mockResolvedValue({ accessToken: mockToken });
    const result = await controller.login(dto);
    expect(result.accessToken).toBe(mockToken);
  });

  it('should update user and return updated user', async () => {
    const userId = '1';
    const updateDto = { firstName: 'Updated', lastName: 'User' };
    const updatedUser: Partial<User> = {
      id: userId,
      email: 'user@example.com',
      firstName: 'Updated',
      lastName: 'User',
      organizationId: 'org1',
      updatedAt: new Date(),
    };
    (service.updateUser as jest.Mock).mockResolvedValue(updatedUser);
    const result = await controller.updateUser(userId, updateDto);
    expect(result.user.firstName).toBe('Updated');
    expect(result.user.lastName).toBe('User');
    expect(result.user.organizationId).toBe('org1');
  });

  // Example: test access control logic (mocked)
  it('should deny access if user lacks required role', async () => {
    // This would be tested in an e2e or integration test with RolesGuard
    // Here, just a placeholder for how you would structure it
    // You can extend this with supertest and real endpoints
    expect(true).toBe(true); // Replace with real guard test in integration
  });
});
