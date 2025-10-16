import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { VoteModule } from './vote/vote.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { SupabaseModule } from './supabase/supabase.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [databaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: ['CONFIGURATION(database)'],
      useFactory: (config: ReturnType<typeof databaseConfig>) => config,
    }),
    AuthModule,
    SupabaseModule,
    UploadModule,
    PostsModule,
    VoteModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
