import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateVerificationDto {
  @IsOptional()
  @IsString()
  user_identifier?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

