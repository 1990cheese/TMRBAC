import { Body, Controller, Post, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, OnApplicationBootstrap, Param, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdateUserDto, LoginDto, RegisterDto } from '../../../../libs/data';

@Controller('auth') // Base route for authentication endpoints
export class AuthController implements OnApplicationBootstrap {
  constructor(private authService: AuthService) {}

  // Lifecycle hook to seed roles and permissions when the application starts
  async onApplicationBootstrap() {
    await this.authService.seedRolesAndPermissions();
  }

  @Post('/register')
  @UsePipes(ValidationPipe) // Enable validation for DTOs
  async register(@Body() registerDto: RegisterDto): Promise<any> {
    const user = await this.authService.register(registerDto);
    // Return a subset of user data, not the password hash
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    };
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK) // Explicitly set HTTP status for success
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @Patch('/:id')
  @UsePipes(ValidationPipe)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<any> {
    const user = await this.authService.updateUser(id, updateUserDto);
    return {
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        updatedAt: user.updatedAt,
      },
    };
  }

  // --- Example protected route (for testing purposes) ---
  // We'll replace this with proper RBAC guards later
  // For now, this just shows that JWT authentication is working.
  // @UseGuards(AuthGuard('jwt'))
  // @Get('/profile')
  // getProfile(@Request() req) {
  //   // The 'req.user' object will contain the validated user from JwtStrategy
  //   return req.user;
  // }
}