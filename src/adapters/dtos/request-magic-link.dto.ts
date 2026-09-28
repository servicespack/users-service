import { IsEmail, IsNotEmpty } from 'class-validator'

export class RequestMagicLinkDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string
}
