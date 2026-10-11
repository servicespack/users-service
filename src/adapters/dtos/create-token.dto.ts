import { IsNotEmpty, IsString } from 'class-validator'

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  username!: string

  @IsString()
  @IsNotEmpty()
  password!: string
}
