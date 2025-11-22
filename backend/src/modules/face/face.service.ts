import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import { FaceResult } from './face-result.entity';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class FaceService {
  private regulaFaceUrl: string;

  constructor(
    @InjectRepository(FaceResult)
    private faceRepository: Repository<FaceResult>,
    private configService: ConfigService,
    private verificationService: VerificationService,
  ) {
    this.regulaFaceUrl = this.configService.get('REGULA_FACE_SDK_URL');
  }

  async saveLivenessResult(
    sessionId: string,
    livenessResult: any,
    imagePath: string | null = null,
  ) {
    try {
      // Extract liveness data from frontend result
      const livenessData = this.extractLivenessData(livenessResult);

      // Save or update face result
      let faceResult = await this.faceRepository.findOne({
        where: { session_id: sessionId },
      });

      if (faceResult) {
        Object.assign(faceResult, {
          ...(imagePath && { selfie_image_path: imagePath }),
          raw_liveness_response: livenessResult,
          ...livenessData,
        });
      } else {
        faceResult = this.faceRepository.create({
          session_id: sessionId,
          selfie_image_path: imagePath,
          raw_liveness_response: livenessResult,
          ...livenessData,
        });
      }

      await this.faceRepository.save(faceResult);

      // Update verification session
      await this.verificationService.update(sessionId, {
        liveness_passed: livenessData.liveness_status === 'genuine',
        status: 'in_progress',
      });

      return {
        success: true,
        session_id: sessionId,
        liveness_result: {
          status: livenessData.liveness_status,
          score: livenessData.liveness_score,
          confidence: livenessData.liveness_confidence,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to save liveness result: ${error.message}`,
      );
    }
  }

  async checkLiveness(sessionId: string, filePath: string) {
    try {
      // Call Regula Face SDK for liveness detection
      const livenessResponse = await this.callRegulaLiveness(filePath);

      // Extract liveness data
      const livenessData = this.extractLivenessData(livenessResponse);

      // Save or update face result
      let faceResult = await this.faceRepository.findOne({
        where: { session_id: sessionId },
      });

      if (faceResult) {
        Object.assign(faceResult, {
          selfie_image_path: filePath,
          raw_liveness_response: livenessResponse,
          ...livenessData,
        });
      } else {
        faceResult = this.faceRepository.create({
          session_id: sessionId,
          selfie_image_path: filePath,
          raw_liveness_response: livenessResponse,
          ...livenessData,
        });
      }

      await this.faceRepository.save(faceResult);

      // Update verification session
      await this.verificationService.update(sessionId, {
        liveness_passed: livenessData.liveness_status === 'genuine',
        status: 'in_progress',
      });

      return {
        success: true,
        session_id: sessionId,
        liveness_result: {
          status: livenessData.liveness_status,
          score: livenessData.liveness_score,
          confidence: livenessData.liveness_confidence,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Liveness check failed: ${error.message}`,
      );
    }
  }

  async matchFaces(
    sessionId: string,
    image1Path: string,
    image2Path: string,
  ) {
    try {
      // Call Regula Face SDK for face matching
      const matchResponse = await this.callRegulaMatch(image1Path, image2Path);

      // Extract match data
      const matchData = this.extractMatchData(matchResponse);

      // Update face result
      let faceResult = await this.faceRepository.findOne({
        where: { session_id: sessionId },
      });

      if (faceResult) {
        Object.assign(faceResult, {
          raw_match_response: matchResponse,
          ...matchData,
        });
      } else {
        faceResult = this.faceRepository.create({
          session_id: sessionId,
          raw_match_response: matchResponse,
          ...matchData,
        });
      }

      await this.faceRepository.save(faceResult);

      // Update verification session
      await this.verificationService.update(sessionId, {
        face_matched: matchData.match_status === 'matched',
        match_score: matchData.match_score,
        status: 'completed',
      });

      return {
        success: true,
        session_id: sessionId,
        match_result: {
          status: matchData.match_status,
          score: matchData.match_score,
          similarity: matchData.similarity_score,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Face matching failed: ${error.message}`);
    }
  }

  private async callRegulaLiveness(filePath: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(filePath));

      const response = await axios.post(
        `${this.regulaFaceUrl}/api/liveness`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      return response.data;
    } catch (error) {
      console.error('Regula Liveness Error:', error.message);
      throw new Error(`Regula Liveness API Error: ${error.message}`);
    }
  }

  private async callRegulaMatch(
    image1Path: string,
    image2Path: string,
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image1', fs.createReadStream(image1Path));
      formData.append('image2', fs.createReadStream(image2Path));

      const response = await axios.post(
        `${this.regulaFaceUrl}/api/match`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      return response.data;
    } catch (error) {
      console.error('Regula Match Error:', error.message);
      throw new Error(`Regula Match API Error: ${error.message}`);
    }
  }

  private extractLivenessData(livenessResponse: any): Partial<FaceResult> {
    const result: Partial<FaceResult> = {
      liveness_status: 'unknown',
    };

    try {
      // Extract liveness status
      if (livenessResponse?.liveness) {
        const livenessValue = livenessResponse.liveness;
        result.liveness_status =
          livenessValue === 'Passed' || livenessValue === 1
            ? 'genuine'
            : 'spoof';
      }

      // Extract scores
      if (livenessResponse?.score !== undefined) {
        result.liveness_score = parseFloat(livenessResponse.score);
      }

      if (livenessResponse?.confidence !== undefined) {
        result.liveness_confidence = parseFloat(livenessResponse.confidence);
      }

      // Face detection info
      if (livenessResponse?.faces) {
        result.face_detected = livenessResponse.faces.length > 0;
        result.face_count = livenessResponse.faces.length;
      }

      // Face quality
      if (livenessResponse?.quality !== undefined) {
        result.face_quality_score = parseFloat(livenessResponse.quality);
      }
    } catch (error) {
      console.error('Error extracting liveness data:', error);
    }

    return result;
  }

  private extractMatchData(matchResponse: any): Partial<FaceResult> {
    const result: Partial<FaceResult> = {
      match_status: 'unknown',
    };

    try {
      // Extract similarity score
      if (matchResponse?.similarity !== undefined) {
        result.similarity_score = parseFloat(matchResponse.similarity);
        result.match_score = result.similarity_score;

        // Determine match status based on threshold (e.g., 0.75)
        result.match_status =
          result.similarity_score >= 0.75 ? 'matched' : 'not_matched';
      }

      // Alternative response format
      if (matchResponse?.score !== undefined) {
        result.match_score = parseFloat(matchResponse.score);
        result.match_status =
          result.match_score >= 75 ? 'matched' : 'not_matched';
      }
    } catch (error) {
      console.error('Error extracting match data:', error);
    }

    return result;
  }

  async findBySessionId(sessionId: string): Promise<FaceResult | null> {
    return await this.faceRepository.findOne({
      where: { session_id: sessionId },
    });
  }
}

