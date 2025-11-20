import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private ticketMessagesRepository: Repository<TicketMessage>,
  ) {}

  // Create new ticket
  async createTicket(
    userId: string,
    createTicketDto: CreateTicketDto,
  ): Promise<Ticket> {
    const ticket = this.ticketsRepository.create({
      ...createTicketDto,
      createdBy: userId,
      status: TicketStatus.OPEN,
    });

    return await this.ticketsRepository.save(ticket);
  }

  // Get all tickets for user
  async getUserTickets(userId: string): Promise<Ticket[]> {
    return await this.ticketsRepository.find({
      where: { createdBy: userId },
      relations: ['messages'],
      order: {
        createdAt: 'DESC',
        messages: {
          createdAt: 'ASC',
        },
      },
    });
  }

  // Get single ticket with messages (nested)
  async getTicketById(ticketId: string, userId?: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['messages'],
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has access to this ticket (for user routes)
    if (userId && ticket.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return ticket;
  }

  // Get all tickets for admin
  async getAllTickets(
    status?: TicketStatus,
    priority?: TicketPriority,
    assignedTo?: string,
  ): Promise<Ticket[]> {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .orderBy('ticket.createdAt', 'DESC')
      .addOrderBy('messages.createdAt', 'ASC');

    if (status) {
      query.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      query.andWhere('ticket.priority = :priority', { priority });
    }

    if (assignedTo) {
      query.andWhere('ticket.assignedTo = :assignedTo', { assignedTo });
    }

    return await query.getMany();
  }

  // Update ticket (admin only for assignment)
  async updateTicket(
    ticketId: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    Object.assign(ticket, updateTicketDto);

    return await this.ticketsRepository.save(ticket);
  }

  // Add message to ticket
  async addMessage(
    ticketId: string,
    userId: string,
    createMessageDto: CreateTicketMessageDto,
  ): Promise<TicketMessage> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If ticket is closed, reopen it when new message is added
    if (ticket.status === TicketStatus.CLOSED) {
      ticket.status = TicketStatus.OPEN;
      ticket.closedAt = null;
      await this.ticketsRepository.save(ticket);
    }

    const message = this.ticketMessagesRepository.create({
      ...createMessageDto,
      ticket: { id: ticketId } as Ticket,
      sender: userId,
    });

    return await this.ticketMessagesRepository.save(message);
  }

  // Close ticket
  async closeTicket(ticketId: string, userId?: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has access to close (for user routes)
    if (userId && ticket.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to close this ticket',
      );
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Ticket is already closed');
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();

    return await this.ticketsRepository.save(ticket);
  }

  // Reopen ticket
  async reopenTicket(ticketId: string, userId?: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has access to reopen (for user routes)
    if (userId && ticket.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to reopen this ticket',
      );
    }

    if (ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('Only closed tickets can be reopened');
    }

    ticket.status = TicketStatus.OPEN;
    ticket.closedAt = null;

    return await this.ticketsRepository.save(ticket);
  }

  // Update ticket status
  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
  ): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.status = status;

    if (status === TicketStatus.CLOSED) {
      ticket.closedAt = new Date();
    } else {
      ticket.closedAt = null;
    }

    return await this.ticketsRepository.save(ticket);
  }

  // Assign ticket to admin
  async assignTicket(ticketId: string, adminId: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.assignedTo = adminId;

    // Update status to in_progress if it's open
    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    return await this.ticketsRepository.save(ticket);
  }
}
