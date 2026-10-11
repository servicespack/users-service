import { IsNotEmpty, IsString } from 'class-validator'

export class LoginWithMagicLinkDto {
  @IsString()
  @IsNotEmpty()
  token!: string
}
