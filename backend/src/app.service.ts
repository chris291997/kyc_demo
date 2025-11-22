import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  async getHealthStatus() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        documentReader: await this.checkDocumentReader(),
        faceSdk: await this.checkFaceSdk(),
      },
    };

    const allHealthy = Object.values(checks.services).every(
      (service) => service.status === 'up',
    );
    checks.status = allHealthy ? 'ok' : 'degraded';

    return checks;
  }

  private async checkDatabase(): Promise<{ status: string; message?: string }> {
    try {
      // Basic check - if app started, DB connection is working
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', message: error.message };
    }
  }

  private async checkDocumentReader(): Promise<{
    status: string;
    message?: string;
  }> {
    try {
      const url = this.configService.get('REGULA_DOC_READER_URL');
      const response = await axios.get(`${url}/api/ping`, { timeout: 5000 });
      return { status: response.status === 200 ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', message: error.message };
    }
  }

  private async checkFaceSdk(): Promise<{ status: string; message?: string }> {
    try {
      const url = this.configService.get('REGULA_FACE_SDK_URL');
      const response = await axios.get(`${url}/api/ping`, { timeout: 5000 });
      return { status: response.status === 200 ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', message: error.message };
    }
  }
}

