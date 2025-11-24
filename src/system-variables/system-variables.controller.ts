import { Controller, Get, Put, Body } from '@nestjs/common';
import { SystemVariablesService } from './system-variables.service';

@Controller('system-variables')
export class SystemVariablesController {
  constructor(
    private readonly systemVariablesService: SystemVariablesService,
  ) {}

  @Get('discount-rate')
  async getDiscountRate() {
    const value = await this.systemVariablesService.getVariable('discountRate');
    return { discountRate: value };
  }

  @Put('discount-rate')
  async setDiscountRate(@Body() body: { value: number }) {
    const updated = await this.systemVariablesService.setVariable(
      'discountRate',
      body.value,
    );
    return { discountRate: updated.value };
  }
}
