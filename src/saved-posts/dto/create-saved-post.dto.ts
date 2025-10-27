import { IsUUID } from 'class-validator';

export class CreateSavedPostDto {
  @IsUUID()
  postId: string;
}
