import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { CommunicatesService } from './communicates.service';
import { CreateCommunicateDto } from './dto/create-communicate.dto';
import { UpdateCommunicateDto } from './dto/update-communicate.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('communicates')
export class CommunicatesController {
  constructor(private readonly communicatesService: CommunicatesService) {}

  @Post()
  create(@Body() createCommunicateDto: CreateCommunicateDto) {
    return this.communicatesService.create(createCommunicateDto);
  }

  @Public()
  @Get()
  findAll(@Query('forumId', ParseUUIDPipe) forumId?: string) {
    return this.communicatesService.findAll(forumId);
  }

  @Public()
  @Get('forum/:forumId')
  findByForum(@Param('forumId', ParseUUIDPipe) forumId: string) {
    return this.communicatesService.findByForum(forumId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.communicatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommunicateDto: UpdateCommunicateDto,
  ) {
    return this.communicatesService.update(id, updateCommunicateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.communicatesService.remove(id);
  }
}
