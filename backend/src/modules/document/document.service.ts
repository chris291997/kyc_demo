import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import { DocumentResult } from './document-result.entity';
import { VerificationService } from '../verification/verification.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentService {
  private regulaUrl: string;

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
        status: portraitFile ? 'awaiting_face_match' : 'awaiting_face_match',
      });

      // Extract and save face match result if portrait was provided
      let faceMatchResult: any = null;
      if (portraitFile && regulaResponse) {
        console.log('🔍 Looking for face match results in response...');
        console.log(`📋 Response keys:`, Object.keys(regulaResponse));
        
        let matchScore = 0;
        let similarity = 0;
        let faceComparisonData: any = null;
        
        // When using extPortrait, face comparison results might be at different locations
        // Check top-level fields first (common with extPortrait)
        if (regulaResponse.AuthResult || regulaResponse.authResult) {
          faceComparisonData = regulaResponse.AuthResult || regulaResponse.authResult;
          matchScore = faceComparisonData?.faceComparison?.score || faceComparisonData?.score || faceComparisonData?.matchScore || 0;
          similarity = faceComparisonData?.faceComparison?.similarity || faceComparisonData?.similarity || faceComparisonData?.similarityScore || 0;
          console.log(`✅ Found AuthResult at top level:`, JSON.stringify(faceComparisonData, null, 2));
        }
        
        // Check for FaceComparison at top level
        if (!faceComparisonData && (regulaResponse.FaceComparison || regulaResponse.faceComparison)) {
          faceComparisonData = regulaResponse.FaceComparison || regulaResponse.faceComparison;
          matchScore = faceComparisonData?.score || faceComparisonData?.matchScore || 0;
          similarity = faceComparisonData?.similarity || faceComparisonData?.similarityScore || 0;
          console.log(`✅ Found FaceComparison at top level:`, JSON.stringify(faceComparisonData, null, 2));
        }
        
        // Check containers in ContainerList
        if (!faceComparisonData && regulaResponse?.ContainerList?.List) {
          console.log(`📋 Total containers in response: ${regulaResponse.ContainerList.List.length}`);
          const containers = regulaResponse.ContainerList.List;
          
          for (const container of containers) {
            const resultType = container.result_type;
            console.log(`📊 Container result_type: ${resultType}`);
            
            // Check for face comparison (result_type 13)
            if (resultType === 13) {
              faceComparisonData = container.FaceComparison || container.faceComparison || container;
              matchScore = faceComparisonData?.score || faceComparisonData?.matchScore || container.score || 0;
              similarity = faceComparisonData?.similarity || faceComparisonData?.similarityScore || container.similarity || 0;
              console.log(`✅ Found face comparison (result_type 13):`, JSON.stringify(faceComparisonData, null, 2));
              console.log(`   Score: ${matchScore}, Similarity: ${similarity}`);
              break;
            }
            
            // Also check for FaceComparison object in other containers
            if (container.FaceComparison || container.faceComparison) {
              faceComparisonData = container.FaceComparison || container.faceComparison;
              matchScore = faceComparisonData?.score || faceComparisonData?.matchScore || 0;
              similarity = faceComparisonData?.similarity || faceComparisonData?.similarityScore || 0;
              console.log(`✅ Found FaceComparison in container (result_type ${resultType}):`, JSON.stringify(faceComparisonData, null, 2));
              console.log(`   Score: ${matchScore}, Similarity: ${similarity}`);
              break;
            }
          }
        }
        
        // Extract AuthenticityCheckList data for face matching
        let authenticityPercentage = 0;
        let etalonImageBase64: string | null = null;
        let authenticityImageBase64: string | null = null;

        // Look for AuthenticityCheckList in the response
        const containers = regulaResponse?.ContainerList?.List || [];
        for (const container of containers) {
          // Check if this container has AuthenticityCheckList
          const authenticityCheckList = container.AuthenticityCheckList || container.authenticityCheckList;
          
          if (authenticityCheckList?.List) {
            console.log('🔍 Found AuthenticityCheckList in container');
            
            // Iterate through the checklist items
            for (const checklistItem of authenticityCheckList.List) {
              if (checklistItem?.List) {
                for (const element of checklistItem.List) {
                  // Look for ElementType 29 (face matching authenticity)
                  if (element.ElementType === 29) {
                    console.log('✅ Found ElementType 29 (face matching authenticity)');
                    authenticityPercentage = element.PercentValue || 0;
                    etalonImageBase64 = element.EtalonImage?.image || element.etalonImage?.image || null;
                    authenticityImageBase64 = element.Image?.image || element.image?.image || null;
                    
                    console.log(`📊 Authenticity Percentage: ${authenticityPercentage}%`);
                    console.log(`🖼️ EtalonImage present: ${etalonImageBase64 ? 'Yes' : 'No'}`);
                    console.log(`🖼️ AuthenticityImage present: ${authenticityImageBase64 ? 'Yes' : 'No'}`);
                    
                    // If face comparison data not found, use authenticity percentage as match score
                    // This is the Regula API's way of providing face match confidence
                    if (matchScore === 0 && similarity === 0 && authenticityPercentage > 0) {
                      matchScore = authenticityPercentage;
                      similarity = authenticityPercentage; // Use same value for similarity
                      console.log(`✅ Using Authenticity Percentage (${authenticityPercentage}%) as match score`);
                    }
                    
                    // If we found the data, break out of loops
                    break;
                  }
                }
                if (authenticityPercentage > 0) break;
              }
            }
            if (authenticityPercentage > 0) break;
          }
        }

        if (matchScore === 0 && similarity === 0) {
          console.warn('⚠️ No face comparison results found in response. Check Regula API configuration.');
          console.log('📄 Full response structure:', JSON.stringify(Object.keys(regulaResponse), null, 2));
        }

        // Save portrait image
        const portraitPath = await this.storageService.saveFile(
          portraitFile,
          'portraits',
          sessionId,
        );

        // Save EtalonImage and AuthenticityImage if available
        let etalonImagePath: string | null = null;
        let authenticityImagePath: string | null = null;

        if (etalonImageBase64) {
          try {
            const etalonBuffer = Buffer.from(etalonImageBase64, 'base64');
            const etalonFile: Express.Multer.File = {
              buffer: etalonBuffer,
              originalname: 'etalon.jpg',
              mimetype: 'image/jpeg',
              fieldname: 'etalon',
              encoding: '7bit',
              size: etalonBuffer.length,
            } as Express.Multer.File;
            
            etalonImagePath = await this.storageService.saveFile(
              etalonFile,
              'authenticity',
              sessionId,
            );
            console.log(`💾 Saved EtalonImage to: ${etalonImagePath}`);
          } catch (error) {
            console.error('❌ Failed to save EtalonImage:', error.message);
          }
        }

        if (authenticityImageBase64) {
          try {
            const authBuffer = Buffer.from(authenticityImageBase64, 'base64');
            const authFile: Express.Multer.File = {
              buffer: authBuffer,
              originalname: 'authenticity.jpg',
              mimetype: 'image/jpeg',
              fieldname: 'authenticity',
              encoding: '7bit',
              size: authBuffer.length,
            } as Express.Multer.File;
            
            authenticityImagePath = await this.storageService.saveFile(
              authFile,
              'authenticity',
              sessionId,
            );
            console.log(`💾 Saved AuthenticityImage to: ${authenticityImagePath}`);
          } catch (error) {
            console.error('❌ Failed to save AuthenticityImage:', error.message);
          }
        }

        // Import FaceResult entity
        const { FaceResult } = await import('../face/face-result.entity');
        const { Repository } = await import('typeorm');
        const faceResultRepo = this.documentRepository.manager.getRepository(FaceResult);

        // Create face result - only set match_score and similarity_score if we have actual values
        const faceResult = faceResultRepo.create({
          session_id: sessionId,
          match_status: matchScore > 0 && matchScore >= 75 ? 'match' : 'no_match',
          match_score: matchScore > 0 ? matchScore : null,
          similarity_score: similarity > 0 ? similarity : null,
          selfie_image_path: portraitPath,
          face_detected: matchScore > 0,
          raw_match_response: regulaResponse,
          authenticity_percentage: authenticityPercentage > 0 ? authenticityPercentage : null,
          etalon_image_path: etalonImagePath,
          authenticity_image_path: authenticityImagePath,
        });

        await faceResultRepo.save(faceResult);

        // Update verification session with match results
        await this.verificationService.update(sessionId, {
          face_matched: matchScore > 0 && matchScore >= 75,
          match_score: matchScore > 0 ? matchScore : null,
          status: 'awaiting_liveness',
        });

        faceMatchResult = {
          match_score: matchScore > 0 ? matchScore : null,
          similarity: similarity > 0 ? similarity : null,
          status: matchScore > 0 && matchScore >= 75 ? 'match' : 'no_match',
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
      console.log('📡 Calling Regula Document Reader API...');
      console.log(`📄 Document provided: Yes`);
      console.log(`👤 Portrait provided: ${portraitBase64 ? 'Yes' : 'No'}`);

      // Build request body following the exact format from result.json (lines 1-17)
      const requestBody: any = {
        processParam: {
          scenario: portraitBase64 ? 'FullAuth' : 'FullProcess',
        },
        List: [
          {
            ImageData: {
              image: documentBase64,
            },
          },
        ],
      };

      // If portrait is provided, configure face API for matching
      // IMPORTANT: extPortrait must be at the TOP LEVEL, not in the List array
      if (portraitBase64) {
        console.log('📸 Adding portrait for face matching');
        requestBody.processParam.authParams = {
          checkLiveness: false,
        };
        requestBody.processParam.useFaceApi = true;
        // Add portrait as extPortrait at the root level (not in List array)
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
          timeout: 30000,
        },
      );

      console.log('✅ Regula API Response received');
      return response.data;
    } catch (error) {
      console.error('❌ Regula API Error:', error.response?.data || error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error(`Regula API Error: ${error.message}`);
    }
  }

  private extractDocumentData(regulaResponse: any): Partial<DocumentResult> {
    const result: Partial<DocumentResult> = {
      authenticity_status: 'unknown',
    };

    try {
      console.log('📊 Starting document data extraction...');
      
      // Find containers in ContainerList.List
      const containers = regulaResponse?.ContainerList?.List || [];
      console.log(`🔍 Found ${containers.length} containers in response`);
      
      let textContainer = null;
      let statusContainer = null;
      let imagesContainer = null;
      
      for (const container of containers) {
        // Text data can be in result_type 36 or 37
        if ((container.result_type === 36 || container.result_type === 37) && container.Text) {
          textContainer = container.Text;
          console.log(`✅ Found Text container (result_type ${container.result_type})`);
        }
        if (container.result_type === 33 && container.Status) {
          statusContainer = container.Status;
          console.log('✅ Found Status container (result_type 33)');
        }
        if (container.result_type === 6 && container.Images) {
          imagesContainer = container.Images;
          console.log('✅ Found Images container (result_type 6)');
        }
      }

      // Extract text fields from Text.fieldList
      const textFields = textContainer?.fieldList || [];
      console.log(`📝 Extracting data from ${textFields.length} text fields...`);

      for (const field of textFields) {
        const fieldType = field.fieldType;
        const fieldName = field.fieldName;
        const value = field.value;

        if (value) {
          console.log(`   ✓ ${fieldName} (type=${fieldType}) = ${value}`);
        }

        switch (fieldType) {
          case 0: // Document Class Code (P for Passport)
            result.document_type_code = value;
            break;
          case 1: // Issuing State Code
            result.issuing_country = value;
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
            result.place_of_birth = value;
            break;
          case 8: // Surname
            result.surname = value;
            break;
          case 9: // Given Names
            result.given_names = value;
            break;
          case 11: // Nationality
            result.nationality = value;
            break;
          case 12: // Gender/Sex
            result.gender = value;
            break;
          case 38: // Issuing State Name / Authority
            result.issuing_authority = value;
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

      // Extract document type from Status
      if (statusContainer?.documentType) {
        result.document_type = statusContainer.documentType;
      }

      // Extract authenticity status from Status.detailsOptical.overallStatus
      if (statusContainer?.detailsOptical?.overallStatus !== undefined) {
        const status = statusContainer.detailsOptical.overallStatus;
        result.authenticity_status =
          status === 1 ? 'genuine' : status === 0 ? 'fake' : 'unknown';
        result.authenticity_score = status === 1 ? 100 : status === 0 ? 0 : 50;
        console.log(`📊 Authenticity: ${result.authenticity_status} (score=${result.authenticity_score})`);
      }

      // Check MRZ verification
      result.mrz_verified = statusContainer?.detailsOptical?.mrz === 1;
      
      // Check barcode verification (from RFID details if available)
      result.barcode_verified = statusContainer?.detailsRFID?.overallStatus === 1;

      console.log(`✅ MRZ Verified: ${result.mrz_verified}, Barcode Verified: ${result.barcode_verified}`);

      // Extract face image if available from Images list
      console.log('🔍 Looking for face image in Images container...');
      const imagesList = imagesContainer?.List || [];
      console.log(`📊 Found ${imagesList.length} images`);
      
      let faceImageBase64: string | null = null;
      for (const imageField of imagesList) {
        console.log(`🖼️ Image: fieldType=${imageField.fieldType}, light=${imageField.light}`);
        
        // Field type 6 is portrait/face image
        if (imageField.fieldType === 6 && imageField.image) {
          console.log('✅ Found portrait image (fieldType=6)');
          faceImageBase64 = imageField.image;
          break;
        }
      }
      
      if (!faceImageBase64) {
        console.log('⚠️ No portrait image found in Regula response');
      } else {
        console.log('✅ Portrait image extracted successfully');
        // Add to result as a temporary property (will be processed by caller)
        (result as any).face_image_base64 = faceImageBase64;
      }

      console.log(`📦 Extracted data summary:`, {
        full_name: result.full_name,
        document_number: result.document_number,
        nationality: result.nationality,
        dob: result.date_of_birth,
        expiry: result.expiry_date,
        authenticity: result.authenticity_status,
      });

    } catch (error) {
      console.error('❌ Error extracting document data:', error);
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
}

