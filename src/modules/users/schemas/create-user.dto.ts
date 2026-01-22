export class CreateUserDto {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  image?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
}
