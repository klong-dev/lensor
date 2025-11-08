export class UserDto {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  createdAt: Date;
  updatedAt?: Date;
  emailConfirmedAt?: Date;
  lastSignInAt?: Date;
}
