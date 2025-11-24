import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemVariable } from './system-variables.entity';
import { SystemVariablesService } from './system-variables.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemVariable])],
  providers: [SystemVariablesService],
  exports: [SystemVariablesService],
})
export class SystemVariablesModule {}
