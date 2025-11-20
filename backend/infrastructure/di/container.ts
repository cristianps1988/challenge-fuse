import { SqliteDocumentRepository } from '@/backend/infrastructure/persistence/SqliteDocument.Repository';
import { SqliteExtractionRepository } from '@/backend/infrastructure/persistence/SqliteExtraction.Repository';
import { SqliteCorrectionRepository } from '@/backend/infrastructure/persistence/SqliteCorrection.Repository';
import { SqliteThresholdRepository } from '@/backend/infrastructure/persistence/SqliteThreshold.Repository';
import { OpenAIClassifierService } from '@/backend/infrastructure/external-services/openai/OpenAIClassifier.Service';
import { OpenAIExtractorService } from '@/backend/infrastructure/external-services/openai/OpenAIExtractor.Service';
import { FileSystemStorageService } from '@/backend/infrastructure/external-services/storage/FileSystemStorage.Service';
import { JsonlCorrectionLog } from '@/backend/infrastructure/persistence/JsonlCorrectionLog';
import { ProcessDocumentUseCase } from '@/backend/application/use-cases/ProcessDocument/ProcessDocument.UseCase';
import { GetDocumentUseCase } from '@/backend/application/use-cases/GetDocument/GetDocument.UseCase';
import { CorrectDocumentUseCase } from '@/backend/application/use-cases/CorrectDocument/CorrectDocument.UseCase';
import { CalculateMetricsUseCase } from '@/backend/application/use-cases/CalculateMetrics/CalculateMetrics.UseCase';
import { UpdateThresholdsUseCase } from '@/backend/application/use-cases/UpdateThresholds/UpdateThresholds.UseCase';
import { PipelineOrchestratorService } from '@/backend/application/services/PipelineOrchestrator.Service';
import { LearningLoopService } from '@/backend/application/services/LearningLoop.Service';
import { logger } from '@/backend/infrastructure/logger';

class Container {
  private documentRepository = new SqliteDocumentRepository();
  private extractionRepository = new SqliteExtractionRepository();
  private correctionRepository = new SqliteCorrectionRepository();
  private thresholdRepository = new SqliteThresholdRepository();

  private classifierService = new OpenAIClassifierService();
  private extractorService = new OpenAIExtractorService();
  private storageService = new FileSystemStorageService();

  private correctionLog = new JsonlCorrectionLog();

  private learningLoopService = new LearningLoopService(
    this.correctionRepository,
    this.documentRepository
  );

  private pipelineOrchestrator = new PipelineOrchestratorService(
    this.classifierService,
    this.extractorService
  );

  getProcessDocumentUseCase(): ProcessDocumentUseCase {
    return new ProcessDocumentUseCase(
      this.documentRepository,
      this.extractionRepository,
      this.classifierService,
      this.extractorService,
      this.storageService
    );
  }

  getGetDocumentUseCase(): GetDocumentUseCase {
    return new GetDocumentUseCase(
      this.documentRepository,
      this.extractionRepository,
      this.correctionRepository
    );
  }

  getCorrectDocumentUseCase(): CorrectDocumentUseCase {
    return new CorrectDocumentUseCase(
      this.documentRepository,
      this.extractionRepository,
      this.correctionRepository
    );
  }

  getCalculateMetricsUseCase(): CalculateMetricsUseCase {
    return new CalculateMetricsUseCase(
      this.documentRepository,
      this.extractionRepository,
      this.correctionRepository
    );
  }

  getUpdateThresholdsUseCase(): UpdateThresholdsUseCase {
    return new UpdateThresholdsUseCase(
      this.thresholdRepository
    );
  }

  getLearningLoopService(): LearningLoopService {
    return this.learningLoopService;
  }

  getCorrectionLog(): JsonlCorrectionLog {
    return this.correctionLog;
  }
}

export const container = new Container();

logger.info('Dependency injection container initialized');
