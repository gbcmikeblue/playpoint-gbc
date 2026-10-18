import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from './prisma/prisma.module'
import { JwtAuthGuard } from './common/jwt-auth.guard'
import { AuthModule } from './auth/auth.module'
import { AppInfoModule } from './app-info/app-info.module'
import { HomeModule } from './home/home.module'
import { ActivityModule } from './activity/activity.module'
import { OrderModule } from './order/order.module'
import { TicketModule } from './ticket/ticket.module'
import { CampaignModule } from './campaign/campaign.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') ?? 'dev-secret',
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES') ?? '7d' },
      }),
    }),
    PrismaModule,
    AuthModule,
    AppInfoModule,
    HomeModule,
    ActivityModule,
    OrderModule,
    TicketModule,
    CampaignModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
