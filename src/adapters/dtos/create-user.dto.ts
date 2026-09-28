import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  username!: string

  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[]
}
