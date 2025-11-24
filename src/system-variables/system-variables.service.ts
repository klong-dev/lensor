import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemVariable } from './system-variables.entity';

@Injectable()
export class SystemVariablesService {
  constructor(
    @InjectRepository(SystemVariable)
    private readonly systemVariableRepository: Repository<SystemVariable>,
  ) {}

  async getVariable(key: string): Promise<number> {
    const variable = await this.systemVariableRepository.findOne({
      where: { key },
    });
    return variable ? variable.value : null;
  }

  async setVariable(key: string, value: number): Promise<SystemVariable> {
    let variable = await this.systemVariableRepository.findOne({
      where: { key },
    });
    if (variable) {
      variable.value = value;
      return await this.systemVariableRepository.save(variable);
    } else {
      variable = this.systemVariableRepository.create({ key, value });
      return await this.systemVariableRepository.save(variable);
    }
  }
}
