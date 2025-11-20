import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/admin/guards/admin.guard';
import { TicketsService } from './tickets.service';
import { UploadService } from '../upload/upload.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { TicketStatus, TicketPriority } from './entities/ticket.entity';

@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly uploadService: UploadService,
  ) {}

  // Get all tickets with filters
  @Get()
  async getAllTickets(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const tickets = await this.ticketsService.getAllTickets(
      status,
      priority,
      assignedTo,
    );

    return {
      success: true,
      data: tickets,
    };
  }

  // Get single ticket by ID (admin can access any ticket)
  @Get(':id')
  async getTicket(@Param('id') ticketId: string) {
    const ticket = await this.ticketsService.getTicketById(ticketId);

    return {
      success: true,
      data: ticket,
    };
  }

  // Update ticket details (priority, category, status, assignment)
  @Patch(':id')
  async updateTicket(
    @Param('id') ticketId: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    const ticket = await this.ticketsService.updateTicket(
      ticketId,
      updateTicketDto,
    );

    return {
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    };
  }

  // Assign ticket to admin
  @Patch(':id/assign')
  async assignTicket(
    @Request() req,
    @Param('id') ticketId: string,
    @Body('adminId') adminId?: string,
  ) {
    const user = req.user;
    // If no adminId provided, assign to self
    const assignTo = adminId || user.userId;

    const ticket = await this.ticketsService.assignTicket(ticketId, assignTo);

    return {
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket,
    };
  }

  // Update ticket status
  @Patch(':id/status')
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body('status') status: TicketStatus,
  ) {
    const ticket = await this.ticketsService.updateTicketStatus(
      ticketId,
      status,
    );

    return {
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket,
    };
  }

  // Add admin reply to ticket
  @Post(':id/messages')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async addMessage(
    @Request() req,
    @Param('id') ticketId: string,
    @Body() createMessageDto: CreateTicketMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const user = req.user;

    // Upload attachments if provided
    let attachmentUrls: string[] = [];
    if (files && files.length > 0) {
      attachmentUrls = await this.uploadService.uploadEvidenceFiles(
        files,
        user.userId,
        ticketId,
      );
    }

    // Add message with attachments
    const message = await this.ticketsService.addMessage(
      ticketId,
      user.userId,
      {
        ...createMessageDto,
        attachments: attachmentUrls,
      },
    );

    return {
      success: true,
      message: 'Reply added successfully',
      data: message,
    };
  }

  // Close ticket (admin)
  @Patch(':id/close')
  async closeTicket(@Param('id') ticketId: string) {
    const ticket = await this.ticketsService.closeTicket(ticketId);

    return {
      success: true,
      message: 'Ticket closed successfully',
      data: ticket,
    };
  }

  // Reopen ticket (admin)
  @Patch(':id/reopen')
  async reopenTicket(@Param('id') ticketId: string) {
    const ticket = await this.ticketsService.reopenTicket(ticketId);

    return {
      success: true,
      message: 'Ticket reopened successfully',
      data: ticket,
    };
  }
}
