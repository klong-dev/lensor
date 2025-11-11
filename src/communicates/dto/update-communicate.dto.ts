import { PartialType } from '@nestjs/mapped-types';
import { CreateCommunicateDto } from './create-communicate.dto';

export class UpdateCommunicateDto extends PartialType(CreateCommunicateDto) {}
