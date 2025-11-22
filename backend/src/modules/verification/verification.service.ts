import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationSession } from './verification.entity';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationSession)
    private verificationRepository: Repository<VerificationSession>,
    private storageService: StorageService,
  ) {}

  async create(
    createVerificationDto: CreateVerificationDto,
  ): Promise<VerificationSession> {
    const verification = this.verificationRepository.create(
      createVerificationDto,
    );
    return await this.verificationRepository.save(verification);
  }

  async findAll(): Promise<VerificationSession[]> {
    return await this.verificationRepository.find({
      relations: ['document_results', 'face_results'],
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<VerificationSession> {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['document_results', 'face_results'],
    });

    if (!verification) {
      throw new NotFoundException(`Verification session ${id} not found`);
    }

    return verification;
  }

  async update(
    id: string,
    updateVerificationDto: UpdateVerificationDto,
  ): Promise<VerificationSession> {
    const verification = await this.findOne(id);

    Object.assign(verification, updateVerificationDto);

    return await this.verificationRepository.save(verification);
  }

  async updateStatus(id: string, status: string): Promise<VerificationSession> {
    const verification = await this.findOne(id);
    verification.status = status;
    verification.updated_at = new Date();
    return await this.verificationRepository.save(verification);
  }

  async getReport(id: string) {
    const verification = await this.findOne(id);

    const documentResult = verification.document_results?.[0];
    const faceResult = verification.face_results?.[0];

    return {
      session_id: verification.id,
      status: verification.status,
      created_at: verification.created_at,
      updated_at: verification.updated_at,
      verification_checks: {
        document_verified: verification.document_verified,
        liveness_passed: verification.liveness_passed,
        face_matched: verification.face_matched,
      },
      document_data: documentResult
        ? {
            full_name: documentResult.full_name,
            given_names: documentResult.given_names,
            surname: documentResult.surname,
            document_type: documentResult.document_type,
            document_type_code: documentResult.document_type_code,
            document_number: documentResult.document_number,
            nationality: documentResult.nationality,
            date_of_birth: documentResult.date_of_birth,
            expiry_date: documentResult.expiry_date,
            issue_date: documentResult.issue_date,
            gender: documentResult.gender,
            issuing_country: documentResult.issuing_country,
            issuing_authority: documentResult.issuing_authority,
            place_of_birth: documentResult.place_of_birth,
            address: documentResult.address,
            personal_number: documentResult.personal_number,
            age: documentResult.age,
            authenticity_status: documentResult.authenticity_status,
            authenticity_score: documentResult.authenticity_score,
            mrz_verified: documentResult.mrz_verified,
            barcode_verified: documentResult.barcode_verified,
            document_image_path: documentResult.document_image_path
              ? this.storageService.getFileUrl(documentResult.document_image_path)
              : null,
            face_image_path: documentResult.face_image_path
              ? this.storageService.getFileUrl(documentResult.face_image_path)
              : null,
          }
        : null,
      face_data: faceResult
        ? {
            liveness_status: faceResult.liveness_status,
            liveness_score: faceResult.liveness_score,
            match_status: faceResult.match_status,
            match_score: faceResult.match_score,
            similarity_score: faceResult.similarity_score,
            // Use the uploaded selfie image (from /verification/{id}/images endpoint)
            selfie_image_path: faceResult.selfie_image_path
              ? this.storageService.getFileUrl(faceResult.selfie_image_path)
              : null,
            // Also include document face image for comparison
            document_face_image_path: documentResult?.face_image_path
              ? this.storageService.getFileUrl(documentResult.face_image_path)
              : null,
            // Keep etalon/authenticity for reference (optional)
            etalon_image_path: faceResult.etalon_image_path 
              ? this.storageService.getFileUrl(faceResult.etalon_image_path)
              : null,
            authenticity_image_path: faceResult.authenticity_image_path
              ? this.storageService.getFileUrl(faceResult.authenticity_image_path)
              : null,
          }
        : null,
      overall_match_score: verification.match_score,
    };
  }

  async getStatistics() {
    const total = await this.verificationRepository.count();
    const completed = await this.verificationRepository.count({
      where: { status: 'completed' },
    });
    const failed = await this.verificationRepository.count({
      where: { status: 'failed' },
    });
    const pending = await this.verificationRepository.count({
      where: { status: 'pending' },
    });

    return {
      total,
      completed,
      failed,
      pending,
      success_rate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
    };
  }

  async remove(id: string): Promise<void> {
    const verification = await this.findOne(id);
    await this.verificationRepository.remove(verification);
  }
}

