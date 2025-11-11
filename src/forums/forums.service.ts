import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Forum } from './entities/forum.entity';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(Forum)
    private forumRepository: Repository<Forum>,
  ) {}

  async create(createForumDto: CreateForumDto): Promise<Forum> {
    const forum = this.forumRepository.create(createForumDto);
    return await this.forumRepository.save(forum);
  }

  async findAll(): Promise<Forum[]> {
    return await this.forumRepository
      .createQueryBuilder('forum')
      .where('forum.isActive = :isActive', { isActive: true })
      .loadRelationCountAndMap('forum.communicateCount', 'forum.communicates')
      .getMany();
  }

  async findOne(id: string): Promise<Forum> {
    return await this.forumRepository
      .createQueryBuilder('forum')
      .where('forum.id = :id', { id })
      .loadRelationCountAndMap('forum.communicateCount', 'forum.communicates')
      .getOne();
  }

  async update(id: string, updateForumDto: UpdateForumDto): Promise<Forum> {
    await this.forumRepository.update(id, updateForumDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.forumRepository.update(id, { isActive: false });
  }
}
