import { IsIn, IsNotEmpty, IsString } from 'class-validator'

export class CreateVerificationDto {
  @IsNotEmpty()
  @IsString()
  user_id!: string

  @IsNotEmpty()
  @IsIn(['email'])
  type!: string

  @IsNotEmpty()
  @IsString()
  key!: string
}
