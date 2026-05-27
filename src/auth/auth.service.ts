import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { db } from '../database/database';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    if (db.findUserByUsername(dto.username)) {
      throw new ConflictException('Username already taken');
    }
    if (db.findUserByEmail(dto.email)) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = db.createUser({
      username: dto.username,
      email: dto.email,
      password: hashed,
      role: dto.role || 'user',
    });

    const token = this.signToken(user.id, user.username, user.role);
    return {
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    const user = db.findUserByUsername(dto.username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user.id, user.username, user.role);
    return {
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      access_token: token,
    };
  }

  getProfile(userId: string) {
    const user = db.findUserById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const { password: _, ...profile } = user;
    return profile;
  }

  private signToken(sub: string, username: string, role: string) {
    return this.jwtService.sign({ sub, username, role });
  }
}
