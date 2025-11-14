import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { VoteModule } from './vote/vote.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CategoriesModule } from './categories/categories.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { SavedPostsModule } from './saved-posts/saved-posts.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ForumsModule } from './forums/forums.module';
import { CommunicatesModule } from './communicates/communicates.module';
import { UserFollowsModule } from './user-follows/user-follows.module';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { PostLikesModule } from './post-likes/post-likes.module';
import { PostCommentsModule } from './post-comments/post-comments.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentHistoryModule } from './payment-history/payment-history.module';
import { ChatModule } from './chat/chat.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [databaseConfig, jwtConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: ['CONFIGURATION(database)'],
      useFactory: (config: ReturnType<typeof databaseConfig>) => config,
    }),
    AuthModule,
    SupabaseModule,
    UploadModule,
    PostsModule,
    VoteModule,
    CategoriesModule,
    NotificationsModule,
    ProfileModule,
    SavedPostsModule,
    ForumsModule,
    CommunicatesModule,
    UserFollowsModule,
    ProductsModule,
    UploadsModule,
    UsersModule,
    PostLikesModule,
    PostCommentsModule,
    CartModule,
    PaymentModule,
    OrdersModule,
    WalletModule,
    PaymentHistoryModule,
    ChatModule,
    ReportsModule,
    AdminModule,
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
