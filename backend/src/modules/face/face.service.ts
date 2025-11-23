import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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
    @Inject(forwardRef(() => VerificationService))
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
      // The Face SDK web component returns minimal data: { transactionId, status, tag }
      // We use the data provided by the frontend directly
      
      let finalLivenessResult = livenessResult;
      
      // Check if we have at least the basic liveness data
      if (!livenessResult?.transactionId) {
        throw new BadRequestException(
          'transactionId is required. Please ensure the liveness check completed successfully.',
        );
      }

      // Extract liveness data from result
      const livenessData = this.extractLivenessData(finalLivenessResult);

      // Save or update face result
      let faceResult = await this.faceRepository.findOne({
        where: { session_id: sessionId },
      });

      if (faceResult) {
        Object.assign(faceResult, {
          ...(imagePath && { selfie_image_path: imagePath }),
          raw_liveness_response: finalLivenessResult,
          ...livenessData,
        });
      } else {
        faceResult = this.faceRepository.create({
          session_id: sessionId,
          selfie_image_path: imagePath,
          raw_liveness_response: finalLivenessResult,
          ...livenessData,
        });
      }

      await this.faceRepository.save(faceResult);

      // Update verification session
      const livenessPassed = livenessData.liveness_status === 'genuine';
      await this.verificationService.update(sessionId, {
        liveness_passed: livenessPassed,
        status: 'completed',
      });

      return {
        success: true,
        session_id: sessionId,
        liveness_status: livenessData.liveness_status,
        liveness_score: livenessData.liveness_score,
        liveness_confidence: livenessData.liveness_confidence,
        liveness_code: livenessData.liveness_code,
        liveness_transaction_id: livenessData.liveness_transaction_id,
        liveness_tag: livenessData.liveness_tag,
        liveness_type: livenessData.liveness_type,
        liveness_estimated_age: livenessData.liveness_estimated_age,
        liveness_metadata: livenessData.liveness_metadata,
      };
    } catch (error) {
      console.error('Error saving liveness result:', error.message);
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

      // Update face result - save selfie image path for preview
      let faceResult = await this.faceRepository.findOne({
        where: { session_id: sessionId },
      });

      if (faceResult) {
        Object.assign(faceResult, {
          selfie_image_path: image2Path, // Save selfie image path for preview
          raw_match_response: matchResponse,
          ...matchData,
        });
      } else {
        faceResult = this.faceRepository.create({
          session_id: sessionId,
          selfie_image_path: image2Path, // Save selfie image path for preview
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

  /**
   * Fetch liveness result from Regula Face SDK Liveness 2.0 API using transactionId
   * Uses GET /api/v2/liveness?transactionId={transactionId} to get authoritative data
   * 
   * Response format:
   * - status: 0 = confirmed (genuine), 1 = not confirmed (spoof)
   * - transactionId: UUID
   * - tag: session identifier
   * - code: result code
   * - estimatedAge: single number (age estimate)
   * - images: array of base64 images
   * - metadata: object with elapsedTime, serverTime, ctx, etc.
   * - type: 0 = active, 1 = passive
   */
  async fetchLivenessFromTransactionId(transactionId: string): Promise<any> {
    try {
      const url = `${this.regulaFaceUrl}/api/v2/liveness?transactionId=${transactionId}`;
      console.log(`🔍 Fetching liveness result from Regula API: GET ${url}`);
      
      const response = await axios.get(
        `${this.regulaFaceUrl}/api/v2/liveness`,
        {
          params: {
            transactionId,
          },
          timeout: 30000,
        },
      );

      console.log('✅ Successfully fetched liveness result from Regula API');
      console.log('📋 Regula API response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Regula Liveness 2.0 Fetch Error:', error.message);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
      throw new Error(`Failed to fetch liveness result from Regula API: ${error.message}`);
    }
  }

  /**
   * Legacy method: Call Regula Face SDK for liveness detection (old API)
   * Note: This uses the old /api/liveness endpoint which may not be available in Liveness 2.0
   */
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

  /**
   * Extract liveness data from Regula Face SDK Liveness 2.0 response
   * Supports both Liveness 2.0 format and legacy format for backward compatibility
   * 
   * Liveness 2.0 format (from GET /api/v2/liveness?transactionId={id}):
   * - status: 0 = confirmed (genuine), 1 = not confirmed (spoof)
   * - transactionId: UUID
   * - tag: session identifier
   * - code: result code
   * - portrait: link to portrait image
   * - video: link to session video
   * - age: array of age estimates
   * - metadata: additional metadata
   * - type: 0 = active, 1 = passive
   */
  private extractLivenessData(livenessResponse: any): Partial<FaceResult> {
    const result: Partial<FaceResult> = {
      liveness_status: 'unknown',
    };

    try {
      // Check if result is nested in fullResponse (from frontend web component)
      let responseData = livenessResponse;
      if (livenessResponse?.fullResponse) {
        responseData = livenessResponse.fullResponse;
      }

      // Handle Liveness 2.0 format (from Regula Face SDK Web API)
      // status: 0 = confirmed (genuine), 1 = not confirmed (spoof)
      if (responseData?.status !== undefined && responseData.status !== null) {
        result.liveness_status = responseData.status === 0 ? 'genuine' : 'spoof';
      }
      else if (livenessResponse?.status !== undefined && livenessResponse.status !== null) {
        result.liveness_status = livenessResponse.status === 0 ? 'genuine' : 'spoof';
      }
      else if (livenessResponse?.status === 0 || livenessResponse?.status === 1) {
        result.liveness_status = livenessResponse.status === 0 ? 'genuine' : 'spoof';
      }
      // Check code field (Regula Face SDK Web Component uses code)
      // code: 0 = genuine, non-zero = spoof or failed
      else if (responseData?.code !== undefined && responseData.code !== null) {
        result.liveness_status = responseData.code === 0 ? 'genuine' : 'spoof';
      }
      else if (livenessResponse?.code !== undefined && livenessResponse.code !== null) {
        result.liveness_status = livenessResponse.code === 0 ? 'genuine' : 'spoof';
      }
      // Handle legacy format
      else if (responseData?.liveness !== undefined || livenessResponse?.liveness !== undefined) {
        const livenessValue = responseData?.liveness || livenessResponse?.liveness;
        result.liveness_status =
          livenessValue === 'Passed' || livenessValue === 1 || livenessValue === 'genuine'
            ? 'genuine'
            : 'spoof';
      }
      // Handle status as string
      else if (responseData?.status === 'genuine' || responseData?.status === 'spoof' ||
               livenessResponse?.status === 'genuine' || livenessResponse?.status === 'spoof') {
        result.liveness_status = responseData?.status || livenessResponse?.status;
      }

      // Extract scores - Liveness 2.0 may not have explicit score/confidence
      // but we can derive from status or use metadata
      if (responseData?.score !== undefined) {
        result.liveness_score = parseFloat(responseData.score);
      } else if (livenessResponse?.score !== undefined) {
        result.liveness_score = parseFloat(livenessResponse.score);
      } else if (responseData?.status === 0 || livenessResponse?.status === 0) {
        // If status is 0 (genuine), set a high confidence score
        result.liveness_score = 1.0;
      } else if (responseData?.status === 1 || livenessResponse?.status === 1) {
        // If status is 1 (spoof), set a low confidence score
        result.liveness_score = 0.0;
      }

      if (responseData?.confidence !== undefined) {
        result.liveness_confidence = parseFloat(responseData.confidence);
      } else if (livenessResponse?.confidence !== undefined) {
        result.liveness_confidence = parseFloat(livenessResponse.confidence);
      } else if (responseData?.status !== undefined || livenessResponse?.status !== undefined) {
        // Derive confidence from status
        const status = responseData?.status ?? livenessResponse?.status;
        result.liveness_confidence = status === 0 ? 1.0 : 0.0;
      }

      // Face detection info (legacy format)
      if (responseData?.faces) {
        result.face_detected = responseData.faces.length > 0;
        result.face_count = responseData.faces.length;
      } else if (livenessResponse?.faces) {
        result.face_detected = livenessResponse.faces.length > 0;
        result.face_count = livenessResponse.faces.length;
      } else if (responseData?.portrait || livenessResponse?.portrait) {
        // If portrait exists, face was detected
        result.face_detected = true;
        result.face_count = 1;
      }

      // Face quality (legacy format)
      if (responseData?.quality !== undefined) {
        result.face_quality_score = parseFloat(responseData.quality);
      } else if (livenessResponse?.quality !== undefined) {
        result.face_quality_score = parseFloat(livenessResponse.quality);
      }

      // Extract transactionId (required for fetching full result later)
      if (responseData?.transactionId) {
        result.liveness_transaction_id = responseData.transactionId;
      } else if (livenessResponse?.transactionId) {
        result.liveness_transaction_id = livenessResponse.transactionId;
      }

      // Extract tag
      if (responseData?.tag) {
        result.liveness_tag = responseData.tag;
      } else if (livenessResponse?.tag) {
        result.liveness_tag = livenessResponse.tag;
      }

      // Extract liveness type (active, passive, etc.)
      if (responseData?.livenessType) {
        result.liveness_type = responseData.livenessType;
      } else if (livenessResponse?.livenessType) {
        result.liveness_type = livenessResponse.livenessType;
      } else if (responseData?.type) {
        result.liveness_type = responseData.type;
      } else if (livenessResponse?.type) {
        result.liveness_type = livenessResponse.type;
      }

      // Extract estimated age
      if (responseData?.estimatedAge !== undefined) {
        result.liveness_estimated_age = parseInt(responseData.estimatedAge);
      } else if (livenessResponse?.estimatedAge !== undefined) {
        result.liveness_estimated_age = parseInt(livenessResponse.estimatedAge);
      } else if (responseData?.age !== undefined) {
        result.liveness_estimated_age = parseInt(responseData.age);
      } else if (livenessResponse?.age !== undefined) {
        result.liveness_estimated_age = parseInt(livenessResponse.age);
      }

      // Extract liveness code
      if (responseData?.code !== undefined) {
        result.liveness_code = responseData.code;
      } else if (livenessResponse?.code !== undefined) {
        result.liveness_code = livenessResponse.code;
      }

      // Extract metadata
      if (responseData?.metadata) {
        result.liveness_metadata = responseData.metadata;
      } else if (livenessResponse?.metadata) {
        result.liveness_metadata = livenessResponse.metadata;
      }

      // Extract images (array of base64 images from liveness check)
      if (responseData?.images && Array.isArray(responseData.images)) {
        result.liveness_images = responseData.images;
      } else if (livenessResponse?.images && Array.isArray(livenessResponse.images)) {
        result.liveness_images = livenessResponse.images;
      } else if (responseData?.capture && Array.isArray(responseData.capture)) {
        result.liveness_images = responseData.capture;
      } else if (livenessResponse?.capture && Array.isArray(livenessResponse.capture)) {
        result.liveness_images = livenessResponse.capture;
      }

      // Extract type (0 = active, 1 = passive)
      if (responseData?.type !== undefined) {
        result.liveness_type = responseData.type;
      } else if (livenessResponse?.type !== undefined) {
        result.liveness_type = livenessResponse.type;
      }

      // Extract estimatedAge (single number, not array)
      if (responseData?.estimatedAge !== undefined) {
        result.liveness_estimated_age = parseInt(responseData.estimatedAge);
      } else if (livenessResponse?.estimatedAge !== undefined) {
        result.liveness_estimated_age = parseInt(livenessResponse.estimatedAge);
      }

      // Extract code
      if (responseData?.code !== undefined) {
        result.liveness_code = parseInt(responseData.code);
      } else if (livenessResponse?.code !== undefined) {
        result.liveness_code = parseInt(livenessResponse.code);
      }

      // Extract metadata (elapsedTime, serverTime, ctx, etc.)
      if (responseData?.metadata) {
        result.liveness_metadata = responseData.metadata;
      } else if (livenessResponse?.metadata) {
        result.liveness_metadata = livenessResponse.metadata;
      }

      // Extract images array (base64 images)
      if (responseData?.images && Array.isArray(responseData.images)) {
        result.liveness_images = responseData.images;
      } else if (livenessResponse?.images && Array.isArray(livenessResponse.images)) {
        result.liveness_images = livenessResponse.images;
      }

      // Age estimation (legacy format - array)
      if (responseData?.age && Array.isArray(responseData.age) && responseData.age.length > 0) {
        // Store age data in metadata if needed
        if (!result.liveness_metadata) {
          result.liveness_metadata = {};
        }
        result.liveness_metadata.age = responseData.age;
      } else if (livenessResponse?.age && Array.isArray(livenessResponse.age) && livenessResponse.age.length > 0) {
        if (!result.liveness_metadata) {
          result.liveness_metadata = {};
        }
        result.liveness_metadata.age = livenessResponse.age;
      }

      // If we still have 'unknown' status, set to null
      if (result.liveness_status === 'unknown') {
        result.liveness_status = null;
      }
    } catch (error) {
      console.error('Error extracting liveness data:', error.message);
      result.liveness_status = null;
    }

    return result;
  }

  /**
   * Public method to extract liveness data (used by VerificationService)
   */
  extractLivenessDataPublic(livenessResponse: any): Partial<FaceResult> {
    return this.extractLivenessData(livenessResponse);
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

  /**
   * Save or update face result (public method for use by VerificationService)
   */
  async saveFaceResult(faceResult: FaceResult): Promise<FaceResult> {
    return await this.faceRepository.save(faceResult);
  }

  /**
   * Store liveness transactionId (called when frontend completes liveness check)
   * The full result will be fetched later when generating the report
   */
  async storeLivenessTransactionId(
    sessionId: string,
    transactionId: string,
    tag?: string,
  ): Promise<FaceResult> {
    let faceResult = await this.faceRepository.findOne({
      where: { session_id: sessionId },
    });

    if (faceResult) {
      faceResult.liveness_transaction_id = transactionId;
      if (tag) {
        faceResult.liveness_tag = tag;
      }
    } else {
      faceResult = this.faceRepository.create({
        session_id: sessionId,
        liveness_transaction_id: transactionId,
        liveness_tag: tag,
      });
    }

    return await this.faceRepository.save(faceResult);
  }
}

