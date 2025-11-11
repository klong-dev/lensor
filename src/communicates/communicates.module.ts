import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicatesService } from './communicates.service';
import { CommunicatesController } from './communicates.controller';
import { Communicate } from './entities/communicate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Communicate])],
  providers: [CommunicatesService],
  controllers: [CommunicatesController],
  exports: [CommunicatesService],
})
export class CommunicatesModule {}
