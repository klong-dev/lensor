import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
