import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AppDataSource } from '../database/dataSource';
import { User } from '../entities/User';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private jwtSecret: string;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      const validation = this.validateRegistrationData(data);
      if (!validation.isValid) {
        return { success: false, message: validation.message };
      }

      // Check if username already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { username: data.username },
          { email: data.email }
        ]
      });

      if (existingUser) {
        if (existingUser.username === data.username) {
          return { success: false, message: 'Username already exists' };
        }
        if (existingUser.email === data.email) {
          return { success: false, message: 'Email already exists' };
        }
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = new User();
      user.username = data.username.toLowerCase().trim();
      user.email = data.email.toLowerCase().trim();
      user.passwordHash = passwordHash;
      user.displayName = data.displayName?.trim() || data.username;
      user.lastLoginAt = new Date();
      
      // Set default preferences
      user.preferences = {
        favoriteGames: [],
        preferredRoles: [],
        notifications: {
          email: true,
          teamInvites: true,
          gameReminders: true
        }
      };

      await this.userRepository.save(user);

      // Generate JWT token
      const token = this.generateToken(user);

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword as User,
        token,
        message: 'Registration successful'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  async login(data: LoginData): Promise<AuthResult> {
    try {
      // Find user by username or email
      const user = await this.userRepository.findOne({
        where: [
          { username: data.username.toLowerCase().trim() },
          { email: data.username.toLowerCase().trim() }
        ]
      });

      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Account is deactivated. Please contact support.' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate JWT token
      const token = this.generateToken(user);

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword as User,
        token,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: User; message?: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return { valid: false, message: 'User not found or deactivated' };
      }

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        valid: true,
        user: userWithoutPassword as User
      };

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, message: 'Token expired' };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, message: 'Invalid token' };
      }
      
      console.error('Token verification error:', error);
      return { valid: false, message: 'Token verification failed' };
    }
  }

  async refreshToken(oldToken: string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      // Verify the old token (even if expired, we can still decode it)
      const decoded = jwt.decode(oldToken) as any;
      
      if (!decoded || !decoded.userId) {
        return { success: false, message: 'Invalid token' };
      }

      const user = await this.userRepository.findOne({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return { success: false, message: 'User not found or deactivated' };
      }

      // Generate new token
      const newToken = this.generateToken(user);

      return {
        success: true,
        token: newToken,
        message: 'Token refreshed successfully'
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, message: 'Token refresh failed' };
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { username: username.toLowerCase().trim() },
        relations: ['teamMemberships', 'gameStats']
      });

      if (user) {
        // Remove password hash
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      }

      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<AuthResult> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Only allow certain fields to be updated
      const allowedUpdates = ['displayName', 'bio', 'avatarUrl', 'preferences'];
      const filteredUpdates: Partial<User> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key)) {
          (filteredUpdates as any)[key] = value;
        }
      }

      Object.assign(user, filteredUpdates);
      await this.userRepository.save(user);

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword as User,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long' };
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      user.passwordHash = newPasswordHash;
      await this.userRepository.save(user);

      return { success: true, message: 'Password changed successfully' };

    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Password change failed' };
    }
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '7d', // Token expires in 7 days
      issuer: 'alliance-platform',
      subject: user.id
    });
  }

  private validateRegistrationData(data: RegisterData): { isValid: boolean; message?: string } {
    // Username validation
    if (!data.username || data.username.trim().length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }

    if (data.username.trim().length > 50) {
      return { isValid: false, message: 'Username must be less than 50 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(data.username.trim())) {
      return { isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    // Email validation
    if (!data.email || !this.isValidEmail(data.email)) {
      return { isValid: false, message: 'Please provide a valid email address' };
    }

    // Password validation
    if (!data.password || data.password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (data.password.length > 128) {
      return { isValid: false, message: 'Password must be less than 128 characters' };
    }

    // Display name validation
    if (data.displayName && data.displayName.trim().length > 100) {
      return { isValid: false, message: 'Display name must be less than 100 characters' };
    }

    return { isValid: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}