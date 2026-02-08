import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DocumentResult } from './document-result.entity';
import { VerificationService } from '../verification/verification.service';
import { StorageService } from '../storage/storage.service';

// Constants
const MATCH_THRESHOLD = 75;
const REGULA_TIMEOUT = 30000;
const FACE_IMAGE_FIELD_TYPE = 6;
const AUTHENTICITY_ELEMENT_TYPE = 29;

@Injectable()
export class DocumentService {
  private readonly regulaUrl: string;

  constructor(
    @InjectRepository(DocumentResult)
    private documentRepository: Repository<DocumentResult>,
    private configService: ConfigService,
    private verificationService: VerificationService,
    private storageService: StorageService,
  ) {
    this.regulaUrl = this.configService.get('REGULA_DOC_READER_URL');
  }

  async processDocument(
    sessionId: string,
    documentFile: Express.Multer.File,
    portraitFile?: Express.Multer.File,
  ): Promise<{
    success: boolean;
    session_id: string;
    document_result: DocumentResult;
    face_match_result?: any;
  }> {
    try {
      // Save the uploaded document image
      const documentPath = await this.storageService.saveFile(
        documentFile,
        'documents',
        sessionId,
      );

      // Convert document to base64
      const documentBase64 = documentFile.buffer.toString('base64');

      // If portrait is provided, convert it to base64 as well
      let portraitBase64: string | undefined;
      if (portraitFile) {
        portraitBase64 = portraitFile.buffer.toString('base64');
      }

      // Call Regula Document Reader API with or without portrait
      const regulaResponse = await this.callRegulaDocReader(
        documentBase64,
        portraitBase64,
      );

      // Extract data from Regula response
      const extractedData = this.extractDocumentData(regulaResponse);

      // Save face image if extracted from document
      let faceImagePath: string | null = null;
      if ((extractedData as any).face_image_base64) {
        faceImagePath = await this.storageService.saveBase64Image(
          (extractedData as any).face_image_base64,
          'faces',
          sessionId,
          'face-from-document',
        );
        delete (extractedData as any).face_image_base64;
      }

      // Save to database
      const documentResult = this.documentRepository.create({
        session_id: sessionId,
        document_image_path: documentPath,
        face_image_path: faceImagePath,
        raw_response: regulaResponse,
        ...extractedData,
      });

      await this.documentRepository.save(documentResult);

      // Update verification session
      await this.verificationService.update(sessionId, {
        document_verified: extractedData.authenticity_status === 'genuine',
        status: 'awaiting_face_match',
      });

      // Extract and save face match result if portrait was provided
      let faceMatchResult: any = null;
      if (portraitFile && regulaResponse) {
        let { matchScore, similarity } = this.extractFaceComparisonData(regulaResponse);
        const { authenticityPercentage, etalonImageBase64, authenticityImageBase64 } = 
          this.extractAuthenticityData(regulaResponse);
        
        // Use authenticity percentage as fallback if no match score found
        if (matchScore === 0 && similarity === 0 && authenticityPercentage > 0) {
          matchScore = authenticityPercentage;
          similarity = authenticityPercentage;
        }

        // Save portrait image
        const portraitPath = await this.storageService.saveFile(
          portraitFile,
          'portraits',
          sessionId,
        );

        // Save EtalonImage and AuthenticityImage if available
        const [etalonImagePath, authenticityImagePath] = await Promise.all([
          etalonImageBase64 
            ? this.saveBase64AsFile(etalonImageBase64, 'etalon.jpg', 'authenticity', sessionId)
            : Promise.resolve(null),
          authenticityImageBase64
            ? this.saveBase64AsFile(authenticityImageBase64, 'authenticity.jpg', 'authenticity', sessionId)
            : Promise.resolve(null),
        ]);

        // Save face match result
        const faceResult = await this.saveFaceMatchResult(
          sessionId,
          portraitPath,
          matchScore,
          similarity,
          authenticityPercentage,
          etalonImagePath,
          authenticityImagePath,
          regulaResponse,
        );

        // Update verification session with match results
        const isMatched = matchScore > 0 && matchScore >= MATCH_THRESHOLD;
        await this.verificationService.update(sessionId, {
          face_matched: isMatched,
          match_score: matchScore > 0 ? matchScore : null,
          status: 'awaiting_liveness',
        });

        faceMatchResult = {
          match_score: matchScore > 0 ? matchScore : null,
          similarity: similarity > 0 ? similarity : null,
          status: isMatched ? 'match' : 'no_match',
          authenticity_percentage: authenticityPercentage > 0 ? authenticityPercentage : null,
          etalon_image_path: etalonImagePath,
          authenticity_image_path: authenticityImagePath,
          face_result: faceResult,
        };
      }

      return {
        success: true,
        session_id: sessionId,
        document_result: documentResult,
        face_match_result: faceMatchResult,
      };
    } catch (error) {
      throw new BadRequestException(
        `Document processing failed: ${error.message}`,
      );
    }
  }


  private async callRegulaDocReader(
    documentBase64: string,
    portraitBase64?: string,
  ): Promise<any> {
    try {
      const requestBody: any = {
        processParam: {
          scenario: portraitBase64 ? 'FullAuth' : 'FullProcess',
          resultTypesOutput: ['Status', 'Text', 'Images', 'MrzText', 'BarcodeText'],
        },
        List: [
          {
            ImageData: {
              image: documentBase64,
            },
          },
        ],
      };

      if (portraitBase64) {
        requestBody.processParam.authParams = {
          checkLiveness: false,
        };
        requestBody.processParam.useFaceApi = true;
        requestBody.extPortrait = portraitBase64;
      }

      const response = await axios.post(
        `${this.regulaUrl}/api/process`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: REGULA_TIMEOUT,
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Regula API Error: ${error.message}`);
    }
  }

  private extractDocumentData(regulaResponse: any): Partial<DocumentResult> {
    const result: Partial<DocumentResult> & {
      document_name?: string | null;
      issuing_state_name?: string | null;
    } = {
      authenticity_status: 'unknown',
    };

    try {
      // Check top-level fields first
      result.document_type = this.extractDocumentType(regulaResponse);
      result.document_name = this.extractDocumentName(regulaResponse);

      const containers = regulaResponse?.ContainerList?.List || [];
      
      let textContainer = null;
      let statusContainer = null;
      let imagesContainer = null;
      let docVisualExtendedInfo = null;
      let oneCandidate = null;
      
      for (const container of containers) {
        if ((container.result_type === 36 || container.result_type === 37) && container.Text) {
          textContainer = container.Text;
        }
        if (container.result_type === 33 && container.Status) {
          statusContainer = container.Status;
        }
        if (container.result_type === 6 && container.Images) {
          imagesContainer = container.Images;
        }
        // Check for OneCandidate (result_type 9)
        if (container.result_type === 9 && container.OneCandidate) {
          oneCandidate = container.OneCandidate;
        }
        // Check for DocVisualExtendedInfo in result_type 36 container
        if (container.result_type === 36 && container.DocVisualExtendedInfo) {
          docVisualExtendedInfo = container.DocVisualExtendedInfo;
        }
        // Also check if DocVisualExtendedInfo is nested in Text container
        if (container.Text?.DocVisualExtendedInfo) {
          docVisualExtendedInfo = container.Text.DocVisualExtendedInfo;
        }
      }

      // Extract from DocVisualExtendedInfo.pArrayFields FIRST (takes precedence)
      if (docVisualExtendedInfo?.pArrayFields) {
        for (const field of docVisualExtendedInfo.pArrayFields) {
          const fieldType = field.fieldType;
          const fieldName = field.fieldName;
          
          const trimmedValue = this.extractFieldValue(field);
          if (!trimmedValue) continue;

          // Check both fieldType and fieldName for Authority to ensure we get the right field
          if ((fieldType === 24 || fieldName === 'Authority' || fieldName === 'Issuing Authority') && trimmedValue) {
            // Trust the Regula response - if fieldType is 24 or fieldName indicates Authority, use it
            result.issuing_authority = trimmedValue;
          } else if ((fieldType === 1 || fieldName === 'Issuing State Code') && trimmedValue) {
            // This is the code (PHL), not the name
            // The name might be in valueList with VISUAL source
            const visualValue = this.findVisualValue(field.valueList);
            if (visualValue && visualValue !== trimmedValue) {
              result.issuing_state_name = visualValue;
            }
          } else if ((fieldType === 38 || fieldName === 'Issuing State Name') && trimmedValue) {
            // Issuing State Name (full country name like "Philippines")
            result.issuing_state_name = trimmedValue;
          } else if ((fieldType === 6 || fieldName === 'Place of Birth') && trimmedValue) {
            result.place_of_birth = trimmedValue;
          } else if ((fieldType === 11 || fieldName === 'Nationality') && trimmedValue) {
            result.nationality = trimmedValue;
          }
        }
      }

      const textFields = textContainer?.fieldList || [];

      for (const field of textFields) {
        const fieldType = field.fieldType;
        const fieldName = field.fieldName;
        const value = field.value;

        // Skip issuing_authority if already set from DocVisualExtendedInfo
        if (fieldType === 24 || fieldType === 38) {
          if (result.issuing_authority && fieldType === 24) {
            continue; // Skip, already set from DocVisualExtendedInfo
          }
        }

        // Check fieldName for Authority or Issuing Authority (in case fieldType doesn't match)
        if ((fieldName === 'Authority' || fieldName === 'Issuing Authority') && value && value.trim() && !result.issuing_authority) {
          const trimmedValue = value.trim();
          // Trust the Regula response - if fieldName indicates Authority, use it
          result.issuing_authority = trimmedValue;
          continue; // Skip the switch case for this field
        }

        switch (fieldType) {
          case 0: // Document Class Code (P for Passport)
            result.document_type_code = value;
            break;
          case 1: // Issuing State Code
            result.issuing_country = value;
            // Also check if there's a VISUAL source value in valueList for the state name
            const visualValue = this.findVisualValue(field.valueList);
            if (visualValue && visualValue !== value) {
              result.issuing_state_name = visualValue;
            }
            break;
          case 2: // Document Number
            result.document_number = value;
            break;
          case 3: // Date of Expiry
            result.expiry_date = this.parseDate(value);
            break;
          case 4: // Date of Issue
            result.issue_date = this.parseDate(value);
            break;
          case 5: // Date of Birth
            result.date_of_birth = this.parseDate(value);
            break;
          case 6: // Place of Birth
            if (!result.place_of_birth) {
            result.place_of_birth = value;
            }
            break;
          case 8: // Surname
            result.surname = value;
            break;
          case 9: // Given Names
            result.given_names = value;
            break;
          case 11: // Nationality
            if (!result.nationality) {
            result.nationality = value;
            }
            break;
          case 12: // Gender/Sex
            result.gender = value;
            break;
          case 24: // Authority (from Text container, but DocVisualExtendedInfo takes precedence)
            if (!result.issuing_authority && value && value.trim()) {
              // Trust the Regula response - fieldType 24 is Authority
              result.issuing_authority = value.trim();
            }
            break;
          case 38: // Issuing State Name
            if (value && value.trim() && !result.issuing_state_name) {
              // Trust the Regula response - fieldType 38 is Issuing State Name
              result.issuing_state_name = value.trim();
            }
            break;
          case 185: // Age
            result.age = value;
            break;
          // Additional field types for optional fields
          case 29: // Personal Number (if present)
            result.personal_number = value;
            break;
          case 30: // Address (if present)
            result.address = value;
            break;
        }
      }

      // Combine names
      if (result.given_names && result.surname) {
        result.full_name = `${result.given_names} ${result.surname}`;
      } else if (result.given_names) {
        result.full_name = result.given_names;
      } else if (result.surname) {
        result.full_name = result.surname;
      }

      // Extract document type from Status container
      if (!result.document_type && statusContainer) {
        result.document_type = this.extractDocumentType(statusContainer);
      }

      // Extract document name from Status container
      if (!result.document_name && statusContainer) {
        result.document_name = this.extractDocumentName(statusContainer);
      }

      // Check OneCandidate for document_name and document_type
      if (oneCandidate) {
        if (!result.document_type) {
          result.document_type = this.extractDocumentType(oneCandidate);
        }
        if (!result.document_name) {
          result.document_name = this.extractDocumentName(oneCandidate);
        }
      }

      // Also check in DocVisualExtendedInfo for document name
      if (!result.document_name && docVisualExtendedInfo?.pArrayFields) {
        for (const field of docVisualExtendedInfo.pArrayFields) {
          if (field.fieldName === 'Document Name' || field.fieldName === 'DocumentName') {
            const value = this.extractFieldValue(field);
            if (value) {
              result.document_name = value;
              break;
            }
          }
        }
      }

      if (statusContainer?.detailsOptical?.overallStatus !== undefined) {
        const status = statusContainer.detailsOptical.overallStatus;
        result.authenticity_status =
          status === 1 ? 'genuine' : status === 0 ? 'fake' : 'unknown';
        result.authenticity_score = status === 1 ? 100 : status === 0 ? 0 : 50;
      }

      result.mrz_verified = statusContainer?.detailsOptical?.mrz === 1;
      result.barcode_verified = statusContainer?.detailsRFID?.overallStatus === 1;

      const imagesList = imagesContainer?.List || [];
      let faceImageBase64: string | null = null;
      
      for (const imageField of imagesList) {
        if (imageField.fieldType === FACE_IMAGE_FIELD_TYPE && imageField.image) {
          faceImageBase64 = imageField.image;
          break;
        }
      }
      
      if (faceImageBase64) {
        (result as any).face_image_base64 = faceImageBase64;
      }

    } catch (error) {
      // Error extracting document data, continue with partial data
    }

    return result;
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    try {
      // Try parsing common date formats
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  async findBySessionId(sessionId: string): Promise<DocumentResult | null> {
    return await this.documentRepository.findOne({
      where: { session_id: sessionId },
    });
  }

  async getFaceImagePath(sessionId: string): Promise<string | null> {
    const documentResult = await this.findBySessionId(sessionId);
    return documentResult?.face_image_path || null;
  }

  // Helper methods

  private extractFaceComparisonData(regulaResponse: any): { matchScore: number; similarity: number } {
    let matchScore = 0;
    let similarity = 0;
    let faceComparisonData: any = null;

    // Check top-level fields first (common with extPortrait)
    if (regulaResponse.AuthResult || regulaResponse.authResult) {
      faceComparisonData = regulaResponse.AuthResult || regulaResponse.authResult;
      matchScore = faceComparisonData?.faceComparison?.score || faceComparisonData?.score || faceComparisonData?.matchScore || 0;
      similarity = faceComparisonData?.faceComparison?.similarity || faceComparisonData?.similarity || faceComparisonData?.similarityScore || 0;
    }

    // Check for FaceComparison at top level
    if (!faceComparisonData && (regulaResponse.FaceComparison || regulaResponse.faceComparison)) {
      faceComparisonData = regulaResponse.FaceComparison || regulaResponse.faceComparison;
      matchScore = faceComparisonData?.score || faceComparisonData?.matchScore || 0;
      similarity = faceComparisonData?.similarity || faceComparisonData?.similarityScore || 0;
    }

    // Check containers in ContainerList
    if (!faceComparisonData && regulaResponse?.ContainerList?.List) {
      for (const container of regulaResponse.ContainerList.List) {
        // Check for face comparison (result_type 13)
        if (container.result_type === 13) {
          faceComparisonData = container.FaceComparison || container.faceComparison || container;
          matchScore = faceComparisonData?.score || faceComparisonData?.matchScore || container.score || 0;
          similarity = faceComparisonData?.similarity || faceComparisonData?.similarityScore || container.similarity || 0;
          break;
        }

        // Also check for FaceComparison object in other containers
        if (container.FaceComparison || container.faceComparison) {
          faceComparisonData = container.FaceComparison || container.faceComparison;
          matchScore = faceComparisonData?.score || faceComparisonData?.matchScore || 0;
          similarity = faceComparisonData?.similarity || faceComparisonData?.similarityScore || 0;
          break;
        }
      }
    }

    return { matchScore, similarity };
  }

  private extractAuthenticityData(regulaResponse: any): {
    authenticityPercentage: number;
    etalonImageBase64: string | null;
    authenticityImageBase64: string | null;
  } {
    let authenticityPercentage = 0;
    let etalonImageBase64: string | null = null;
    let authenticityImageBase64: string | null = null;

    const containers = regulaResponse?.ContainerList?.List || [];
    for (const container of containers) {
      const authenticityCheckList = container.AuthenticityCheckList || container.authenticityCheckList;

      if (authenticityCheckList?.List) {
        for (const checklistItem of authenticityCheckList.List) {
          if (checklistItem?.List) {
            for (const element of checklistItem.List) {
              if (element.ElementType === AUTHENTICITY_ELEMENT_TYPE) {
                authenticityPercentage = element.PercentValue || 0;
                etalonImageBase64 = element.EtalonImage?.image || element.etalonImage?.image || null;
                authenticityImageBase64 = element.Image?.image || element.image?.image || null;
                break;
              }
            }
            if (authenticityPercentage > 0) break;
          }
        }
        if (authenticityPercentage > 0) break;
      }
    }

    return { authenticityPercentage, etalonImageBase64, authenticityImageBase64 };
  }

  private async saveBase64AsFile(
    base64Image: string,
    filename: string,
    folder: string,
    sessionId: string,
  ): Promise<string | null> {
    try {
      const buffer = Buffer.from(base64Image, 'base64');
      const file: Express.Multer.File = {
        buffer,
        originalname: filename,
        mimetype: 'image/jpeg',
        fieldname: folder,
        encoding: '7bit',
        size: buffer.length,
      } as Express.Multer.File;

      return await this.storageService.saveFile(file, folder, sessionId);
    } catch {
      return null;
    }
  }

  private async saveFaceMatchResult(
    sessionId: string,
    portraitPath: string,
    matchScore: number,
    similarity: number,
    authenticityPercentage: number,
    etalonImagePath: string | null,
    authenticityImagePath: string | null,
    regulaResponse: any,
  ) {
    const { FaceResult } = await import('../face/face-result.entity');
    const faceResultRepo = this.documentRepository.manager.getRepository(FaceResult);

    const isMatched = matchScore > 0 && matchScore >= MATCH_THRESHOLD;
    const faceResultData = {
      session_id: sessionId,
      match_status: isMatched ? 'matched' : 'not_matched',
      match_score: matchScore > 0 ? matchScore : null,
      similarity_score: similarity > 0 ? similarity : null,
      face_detected: matchScore > 0,
      raw_match_response: regulaResponse,
      authenticity_percentage: authenticityPercentage > 0 ? authenticityPercentage : null,
      etalon_image_path: etalonImagePath,
      authenticity_image_path: authenticityImagePath,
    };

    let faceResult = await faceResultRepo.findOne({
      where: { session_id: sessionId },
    });

    if (faceResult) {
      // Update existing face result - merge match data with existing liveness data
      Object.assign(faceResult, {
        ...faceResultData,
        // Only update selfie_image_path if we have a new portrait (don't overwrite liveness image)
        ...(portraitPath && { selfie_image_path: portraitPath }),
      });
    } else {
      faceResult = faceResultRepo.create({
        ...faceResultData,
        selfie_image_path: portraitPath,
      });
    }

    return await faceResultRepo.save(faceResult);
  }

  private extractFieldValue(field: any): string | null {
    if (field.value?.trim()) {
      return field.value.trim();
    }

    if (field.valueList?.length > 0) {
      // Prefer VISUAL source
      const visualValue = field.valueList.find((v: any) => v.source === 'VISUAL')?.value;
      if (visualValue?.trim()) {
        return visualValue.trim();
      }
      // Fallback to first value
      if (field.valueList[0]?.value?.trim()) {
        return field.valueList[0].value.trim();
      }
    }

    return null;
  }

  private extractDocumentType(source: any): string | null {
    return source?.dDescription || source?.DDescription || source?.documentType || source?.DocumentType || null;
  }

  private extractDocumentName(source: any): string | null {
    return source?.DocumentName || source?.documentName || source?.document_name || null;
  }

  private findVisualValue(valueList: any[] | undefined): string | null {
    if (!valueList || valueList.length === 0) return null;
    
    const visualValue = valueList.find(
      (v: any) => v.source === 'VISUAL' && v.value?.trim() && v.value.trim().length > 3
    );
    
    return visualValue?.value?.trim() || null;
  }
}

