import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    console.log(`Client disconnected: ${client.id}, userId: ${userId}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.connectedUsers.set(client.id, data.userId);
    return { success: true, message: 'Authenticated' };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(data.roomId);
    return { success: true, message: `Joined room ${data.roomId}` };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(data.roomId);
    return { success: true, message: `Left room ${data.roomId}` };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto & { userId: string },
  ) {
    await this.chatService.sendMessage(data.userId, {
      roomId: data.roomId,
      content: data.content,
    });

    // Get user info for the message
    const messageData = await this.chatService.getMessages(data.roomId, 999999);
    const latestMessage = messageData[messageData.length - 1];

    // Broadcast to all clients in the room
    this.server.to(data.roomId).emit('newMessage', latestMessage);

    return { success: true, message: latestMessage };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; isTyping: boolean },
  ) {
    // Broadcast typing indicator to room (except sender)
    client.to(data.roomId).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }
}
