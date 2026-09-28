import { Type } from 'class-transformer'
import {
  IsIn,
  IsPort,
  IsString,
  ValidateNested,
} from 'class-validator'

export class ConfigurationDatabaseDto {
  @IsString()
  uri!: string
}

export class ConfigurationServersHttpDto {
  @IsPort()
  port!: string
}

export class ConfigurationServersGrpcDto {
  @IsPort()
  port!: string
}

export class ConfigurationServersDto {
  @Type(() => ConfigurationServersHttpDto)
  @ValidateNested() http!: ConfigurationServersHttpDto

  @Type(() => ConfigurationServersGrpcDto)
  @ValidateNested() grpc!: ConfigurationServersGrpcDto
}

export class ConfigurationAuthDto {
  @IsString()
  jwtSecret!: string

  @IsString()
  jwtExpiration!: string

  @IsString()
  magicLinkExpiration!: string

  @IsString()
  magicLinkLoginUrl!: string

  @IsString()
  resetPasswordUrl!: string
}

export class ConfigurationNotificationsDto {
  @IsString()
  url!: string
}

export class ConfigurationDto {
  @IsIn(['development', 'production'])
  environment!: 'development' | 'production'

  @Type(() => ConfigurationDatabaseDto)
  @ValidateNested() database!: ConfigurationDatabaseDto

  @Type(() => ConfigurationServersDto)
  @ValidateNested() servers!: ConfigurationServersDto

  @Type(() => ConfigurationAuthDto)
  @ValidateNested() auth!: ConfigurationAuthDto

  @Type(() => ConfigurationNotificationsDto)
  @ValidateNested() notifications!: ConfigurationNotificationsDto
}
