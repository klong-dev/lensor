import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';
import { Forum } from './entities/forum.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Forum])],
  providers: [ForumsService],
  controllers: [ForumsController],
  exports: [ForumsService],
})
export class ForumsModule {}
