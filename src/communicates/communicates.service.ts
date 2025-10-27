import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommunicateDto } from './dto/create-communicate.dto';
import { UpdateCommunicateDto } from './dto/update-communicate.dto';
import { Communicate } from './entities/communicate.entity';

@Injectable()
export class CommunicatesService {
  constructor(
    @InjectRepository(Communicate)
    private communicatesRepository: Repository<Communicate>,
  ) {}

  async create(
    createCommunicateDto: CreateCommunicateDto,
  ): Promise<Communicate> {
    const communicate =
      this.communicatesRepository.create(createCommunicateDto);
    return await this.communicatesRepository.save(communicate);
  }

  async findAll(forumId?: string): Promise<Communicate[]> {
    const queryBuilder = this.communicatesRepository
      .createQueryBuilder('communicate')
      .leftJoin('communicate.forum', 'forum')
      .addSelect(['forum.id', 'forum.name'])
      .where('communicate.isActive = :isActive', { isActive: true })
      .loadRelationCountAndMap('communicate.postCount', 'communicate.posts');

    if (forumId) {
      queryBuilder.andWhere('communicate.forumId = :forumId', { forumId });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Communicate> {
    const communicate = await this.communicatesRepository
      .createQueryBuilder('communicate')
      .leftJoinAndSelect('communicate.forum', 'forum')
      .leftJoinAndSelect('communicate.posts', 'posts')
      .where('communicate.id = :id', { id })
      .andWhere('communicate.isActive = :isActive', { isActive: true })
      .loadRelationCountAndMap('communicate.postCount', 'communicate.posts')
      .getOne();

    if (!communicate) {
      throw new NotFoundException(`Communicate with ID ${id} not found`);
    }

    return communicate;
  }

  async update(
    id: string,
    updateCommunicateDto: UpdateCommunicateDto,
  ): Promise<Communicate> {
    const communicate = await this.findOne(id);
    Object.assign(communicate, updateCommunicateDto);
    return await this.communicatesRepository.save(communicate);
  }

  async remove(id: string): Promise<void> {
    const communicate = await this.findOne(id);
    communicate.isActive = false;
    await this.communicatesRepository.save(communicate);
  }

  async findByForum(forumId: string): Promise<Communicate[]> {
    return await this.communicatesRepository
      .createQueryBuilder('communicate')
      .where('communicate.forumId = :forumId', { forumId })
      .andWhere('communicate.isActive = :isActive', { isActive: true })
      .loadRelationCountAndMap('communicate.postCount', 'communicate.posts')
      .getMany();
  }
}
