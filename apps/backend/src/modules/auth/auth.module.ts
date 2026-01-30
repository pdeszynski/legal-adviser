import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorResolver } from './two-factor.resolver';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { UsersModule } from '../users/users.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { GqlHybridAuthGuard } from './guards/gql-hybrid-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { TotpService } from '../../shared/totp/totp.service';
import { UserRoleEntity } from '../authorization/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleEntity]),
    PassportModule,
    ConfigModule,
    UsersModule,
    ApiKeysModule,
    AuditLogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFactorService,
    TotpService,
    JwtStrategy,
    ApiKeyStrategy,
    AuthResolver,
    TwoFactorResolver,
    GqlAuthGuard,
    GqlHybridAuthGuard,
    RoleGuard,
  ],
  exports: [
    AuthService,
    TwoFactorService,
    TotpService,
    GqlAuthGuard,
    GqlHybridAuthGuard,
    RoleGuard,
  ],
})
export class AuthModule {}
