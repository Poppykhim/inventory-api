import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { db } from '../src/database/database';

describe('AuthService (unit)', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
      providers: [AuthService],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => db.clear());

  describe('register()', () => {
    it('registers user and returns token', async () => {
      const result = await service.register({ username: 'alice', email: 'alice@t.com', password: 'pass123' });
      expect(result.access_token).toBeDefined();
      expect(result.user.username).toBe('alice');
      expect(result.user.role).toBe('user');
    });

    it('throws ConflictException for duplicate username', async () => {
      await service.register({ username: 'alice', email: 'a@t.com', password: 'pass123' });
      await expect(service.register({ username: 'alice', email: 'b@t.com', password: 'pass123' }))
        .rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for duplicate email', async () => {
      await service.register({ username: 'alice', email: 'a@t.com', password: 'pass123' });
      await expect(service.register({ username: 'bob', email: 'a@t.com', password: 'pass123' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    beforeEach(() => service.register({ username: 'alice', email: 'a@t.com', password: 'pass123' }));

    it('returns token on valid credentials', async () => {
      const result = await service.login({ username: 'alice', password: 'pass123' });
      expect(result.access_token).toBeDefined();
    });

    it('throws UnauthorizedException on wrong password', async () => {
      await expect(service.login({ username: 'alice', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for unknown user', async () => {
      await expect(service.login({ username: 'nobody', password: 'pass123' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile()', () => {
    it('returns user profile without password', async () => {
      const { user } = await service.register({ username: 'alice', email: 'a@t.com', password: 'pass123' });
      const profile = service.getProfile(user.id);
      expect(profile.username).toBe('alice');
      expect((profile as any).password).toBeUndefined();
    });

    it('throws UnauthorizedException for invalid ID', () => {
      expect(() => service.getProfile('bad-id')).toThrow(UnauthorizedException);
    });
  });
});
