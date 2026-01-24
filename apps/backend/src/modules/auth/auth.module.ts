import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { UsersModule } from '../users/users.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { GqlHybridAuthGuard } from './guards/gql-hybrid-auth.guard';
import { RoleGuard } from './guards/role.guard';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersModule,
    ApiKeysModule,
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
    JwtStrategy,
    ApiKeyStrategy,
    AuthResolver,
    GqlAuthGuard,
    GqlHybridAuthGuard,
    RoleGuard,
  ],
  exports: [AuthService, GqlAuthGuard, GqlHybridAuthGuard, RoleGuard],
})
export class AuthModule {}
