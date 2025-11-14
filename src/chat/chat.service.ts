import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private supabaseService: SupabaseService,
  ) {}

  async createRoom(userId: string, createRoomDto: CreateRoomDto) {
    const room = this.roomRepository.create({
      name: createRoomDto.name,
      type: createRoomDto.type || 'group',
      participantIds: createRoomDto.participantIds || [userId],
    });
    return await this.roomRepository.save(room);
  }

  async getOrCreateDirectRoom(userId: string, otherUserId: string) {
    // Check if both users exist
    const [user, otherUser] = await Promise.all([
      this.supabaseService.getUserById(userId),
      this.supabaseService.getUserById(otherUserId),
    ]);

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    // Try to find existing direct room between these two users
    const existingRoom = await this.roomRepository
      .createQueryBuilder('room')
      .where('room.type = :type', { type: 'direct' })
      .andWhere(':userId = ANY(room.participantIds)', { userId })
      .andWhere(':otherUserId = ANY(room.participantIds)', { otherUserId })
      .getOne();

    if (existingRoom) {
      return existingRoom;
    }

    // Create new direct room
    const room = this.roomRepository.create({
      name: `${user?.name || user?.email} & ${otherUser.name || otherUser.email}`,
      type: 'direct',
      participantIds: [userId, otherUserId],
    });

    return await this.roomRepository.save(room);
  }

  async getRooms(userId: string) {
    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .where(':userId = ANY(room.participantIds)', { userId })
      .orderBy('room.updatedAt', 'DESC')
      .getMany();

    // Enhance rooms with last message, unread count and participant info
    return await Promise.all(
      rooms.map(async (room) => {
        // Get last message
        const lastMessage = await this.messageRepository.findOne({
          where: { roomId: room.id },
          order: { createdAt: 'DESC' },
        });

        // Get unread count for this user
        const unreadCount = await this.messageRepository.count({
          where: {
            roomId: room.id,
            userId: userId, // Not equal - messages from others
            isRead: false,
          },
        });

        // Get participant info
        const participants = await Promise.all(
          room.participantIds.map(async (id) => {
            const user = await this.supabaseService.getUserById(id);
            return {
              id,
              name: user?.user_metadata.name || user?.email || 'Unknown User',
              avatar:
                user?.user_metadata.avatar_url || '/images/default_avatar.jpg',
            };
          }),
        );

        return {
          ...room,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                userId: lastMessage.userId,
              }
            : null,
          unreadCount,
          participants,
        };
      }),
    );
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
    const messages = await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' }, // Changed to ASC for chronological order
      take: limit,
    });

    // Populate user info for each message
    const m = await Promise.all(
      messages.map(async (message) => {
        const user = await this.supabaseService.getUserById(message.userId);
        return {
          id: message.id,
          roomId: message.roomId,
          userId: message.userId,
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt,
          user: {
            name: user?.user_metadata?.name || user?.email || 'Unknown User',
            avatar:
              user?.user_metadata?.avatar_url || '/images/default_avatar.jpg',
          },
        };
      }),
    );

    return m.reverse();
  }

  async markAsRead(messageId: string) {
    await this.messageRepository.update(messageId, { isRead: true });
  }

  async markRoomMessagesAsRead(roomId: string, userId: string) {
    // Mark all unread messages in this room that are not from this user as read
    await this.messageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('roomId = :roomId', { roomId })
      .andWhere('userId != :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();
  }
}
