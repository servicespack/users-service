import { IsString } from 'class-validator'

export class UpdatePasswordDto {
  @IsString()
  currentPassword!: string

  @IsString()
  newPassword!: string
}
