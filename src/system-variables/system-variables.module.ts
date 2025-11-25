import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemVariable } from './system-variables.entity';
import { SystemVariablesService } from './system-variables.service';
import { SystemVariablesController } from './system-variables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemVariable])],
  controllers: [SystemVariablesController],
  providers: [SystemVariablesService],
  exports: [SystemVariablesService],
})
export class SystemVariablesModule {}
