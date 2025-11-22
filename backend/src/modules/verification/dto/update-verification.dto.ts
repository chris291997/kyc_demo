import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';

export class UpdateVerificationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  document_verified?: boolean;

  @IsOptional()
  @IsBoolean()
  liveness_passed?: boolean;

  @IsOptional()
  @IsBoolean()
  face_matched?: boolean;

  @IsOptional()
  @IsNumber()
  match_score?: number;

  @IsOptional()
  @IsString()
  user_identifier?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

