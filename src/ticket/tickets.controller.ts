import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { UploadService } from '../upload/upload.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly uploadService: UploadService,
  ) {}

  // Create new ticket
  @Post()
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async createTicket(
    @Request() req,
    @Body() createTicketDto: CreateTicketDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const user = req.user;

    // Upload attachments if provided
    let attachmentUrls: string[] = [];
    if (files && files.length > 0) {
      const tempTicketId = `temp_${Date.now()}`;
      attachmentUrls = await this.uploadService.uploadEvidenceFiles(
        files,
        user.userId,
        tempTicketId,
      );
    }

    // Create ticket with attachments
    const ticket = await this.ticketsService.createTicket(user.userId, {
      ...createTicketDto,
      attachments: attachmentUrls,
    });

    return {
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    };
  }

  // Get all user's tickets
  @Get()
  async getUserTickets(@Request() req) {
    const user = req.user;
    const tickets = await this.ticketsService.getUserTickets(user.userId);

    return {
      success: true,
      data: tickets,
    };
  }

  // Get single ticket by ID
  @Get(':id')
  async getTicket(@Request() req, @Param('id') ticketId: string) {
    const user = req.user;
    const ticket = await this.ticketsService.getTicketById(
      ticketId,
      user.userId,
    );

    return {
      success: true,
      data: ticket,
    };
  }

  // Add message/reply to ticket
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

  // Close ticket
  @Patch(':id/close')
  async closeTicket(@Request() req, @Param('id') ticketId: string) {
    const user = req.user;
    const ticket = await this.ticketsService.closeTicket(ticketId, user.userId);

    return {
      success: true,
      message: 'Ticket closed successfully',
      data: ticket,
    };
  }

  // Reopen ticket
  @Patch(':id/reopen')
  async reopenTicket(@Request() req, @Param('id') ticketId: string) {
    const user = req.user;
    const ticket = await this.ticketsService.reopenTicket(
      ticketId,
      user.userId,
    );

    return {
      success: true,
      message: 'Ticket reopened successfully',
      data: ticket,
    };
  }
}
