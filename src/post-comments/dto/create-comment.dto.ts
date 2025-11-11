export class CreateCommentDto {
  content: string;
  parentId?: string; // For nested replies
}
