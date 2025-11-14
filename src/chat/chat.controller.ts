import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @CurrentUser() user: { userId: string },
  ) {
    const room = await this.chatService.createRoom(user.userId, createRoomDto);
    return { data: room };
  }

  @Post('direct/:userId')
  async getOrCreateDirectRoom(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const room = await this.chatService.getOrCreateDirectRoom(
      user.userId,
      otherUserId,
    );
    return { data: room };
  }

  @Get('rooms')
  async getRooms(@CurrentUser() user: { userId: string }) {
    const rooms = await this.chatService.getRooms(user.userId);
    return { data: rooms };
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    const room = await this.chatService.getRoom(id);
    return { data: room };
  }

  @Get('rooms/:id/messages')
  async getMessages(
    @Param('id') roomId: string,
    @Query('limit') limit?: string,
  ) {
    const messages = await this.chatService.getMessages(
      roomId,
      limit ? parseInt(limit) : 50,
    );
    return { data: messages };
  }

  @Post('rooms/:id/read')
  async markRoomAsRead(
    @Param('id') roomId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.chatService.markRoomMessagesAsRead(roomId, user.userId);
    return { data: { success: true } };
  }
}
