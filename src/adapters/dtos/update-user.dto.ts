import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username!: string

  @IsOptional()
  @IsEmail()
  email!: string
}
