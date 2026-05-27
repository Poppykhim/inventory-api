import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { db } from '../../database/database';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'inventory-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = db.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
