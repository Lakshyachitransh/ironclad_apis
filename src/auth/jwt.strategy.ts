// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtUser } from './types/jwt-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any): Promise<JwtUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }

    console.log('JWT Payload:', payload);

    return {
      sub: payload.sub,
      id: payload.id,
      email: payload.email,
      tenantId: payload.tenantId ?? null,
      roles: payload.roles ?? [],
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
