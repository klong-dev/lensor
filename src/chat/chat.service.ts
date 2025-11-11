import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
  ) {}

  async createRoom(userId: string, createRoomDto: CreateRoomDto) {
    const room = this.roomRepository.create({
      name: createRoomDto.name,
      type: createRoomDto.type || 'group',
      participantIds: createRoomDto.participantIds || [userId],
    });
    return await this.roomRepository.save(room);
  }

  async getRooms(userId: string) {
    return await this.roomRepository
      .createQueryBuilder('room')
      .where(':userId = ANY(room.participantIds)', { userId })
      .orderBy('room.updatedAt', 'DESC')
      .getMany();
  }

  async getRoom(roomId: string) {
    return await this.roomRepository.findOne({ where: { id: roomId } });
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    const message = this.messageRepository.create({
      roomId: sendMessageDto.roomId,
      userId,
      content: sendMessageDto.content,
    });
    return await this.messageRepository.save(message);
  }

  async getMessages(roomId: string, limit: number = 50) {
    return await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(messageId: string) {
    await this.messageRepository.update(messageId, { isRead: true });
  }
}
