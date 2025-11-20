import type { ClassifierService, ClassificationResult } from '@/backend/application/ports/ClassifierService';
import type { ExtractorService, ExtractionResult } from '@/backend/application/ports/ExtractorService';

export interface PipelineResult {
  classification: ClassificationResult;
  extraction: ExtractionResult;
  totalTimeMs: number;
}

export class PipelineOrchestratorService {
  constructor(
    private readonly classifierService: ClassifierService,
    private readonly extractorService: ExtractorService
  ) {}

  async process(fileBuffer: Buffer, fileName: string): Promise<PipelineResult> {
    const startTime = Date.now();

    const classification = await this.classifierService.classify(fileBuffer, fileName);

    const extraction = await this.extractorService.extract(
      fileBuffer,
      classification.documentType,
      fileName
    );

    const totalTimeMs = Date.now() - startTime;

    return {
      classification,
      extraction,
      totalTimeMs,
    };
  }

  async processWithRetry(
    fileBuffer: Buffer,
    fileName: string,
    maxRetries: number = 3
  ): Promise<PipelineResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.process(fileBuffer, fileName);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(backoffMs);
      }
    }

    throw lastError ?? new Error('Unknown error in pipeline processing');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
