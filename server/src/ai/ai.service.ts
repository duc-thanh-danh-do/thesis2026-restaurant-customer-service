import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

@Injectable()
export class AiService {
  private readonly model =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  private readonly client = this.createClient();

  async generateText(message: string): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException({
        message: 'GEMINI_API_KEY is not configured',
        code: 'GEMINI_API_KEY_MISSING',
      });
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: message,
      });

      return response.text ?? '';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Gemini API error';

      throw new BadGatewayException({
        message: `Gemini request failed: ${errorMessage}`,
        code: 'GEMINI_REQUEST_FAILED',
      });
    }
  }

  private createClient() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return undefined;
    }

    return new GoogleGenAI({ apiKey });
  }
}
