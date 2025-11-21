import { SqliteDocumentRepository } from '@/backend/infrastructure/persistence/SqliteDocument.Repository';
import { SqliteExtractionRepository } from '@/backend/infrastructure/persistence/SqliteExtraction.Repository';
import { SqliteCorrectionRepository } from '@/backend/infrastructure/persistence/SqliteCorrection.Repository';
import { SqliteThresholdRepository } from '@/backend/infrastructure/persistence/SqliteThreshold.Repository';
import { SqliteSettingsRepository } from '@/backend/infrastructure/persistence/SqliteSettings.Repository';
import { OpenAIClassifierService } from '@/backend/infrastructure/external-services/openai/OpenAIClassifier.Service';
import { OpenAIExtractorService } from '@/backend/infrastructure/external-services/openai/OpenAIExtractor.Service';
import { FileSystemStorageService } from '@/backend/infrastructure/external-services/storage/FileSystemStorage.Service';
import { JsonlCorrectionLog } from '@/backend/infrastructure/persistence/JsonlCorrectionLog';
import { ProcessDocumentUseCase } from '@/backend/application/use-cases/ProcessDocument/ProcessDocument.UseCase';
import { GetDocumentUseCase } from '@/backend/application/use-cases/GetDocument/GetDocument.UseCase';
import { CorrectDocumentUseCase } from '@/backend/application/use-cases/CorrectDocument/CorrectDocument.UseCase';
import { CalculateMetricsUseCase } from '@/backend/application/use-cases/CalculateMetrics/CalculateMetrics.UseCase';
import { UpdateThresholdsUseCase } from '@/backend/application/use-cases/UpdateThresholds/UpdateThresholds.UseCase';
import { GetSettingsUseCase } from '@/backend/application/use-cases/GetSettings/GetSettings.UseCase';
import { UpdateSettingsUseCase } from '@/backend/application/use-cases/UpdateSettings/UpdateSettings.UseCase';
import { PipelineOrchestratorService } from '@/backend/application/services/PipelineOrchestrator.Service';
import { LearningLoopService } from '@/backend/application/services/LearningLoop.Service';
import { DocumentController } from '@/backend/infrastructure/api/controllers/Document.Controller';

class Container {
  private documentRepository = new SqliteDocumentRepository();
  private extractionRepository = new SqliteExtractionRepository();
  private thresholdRepository = new SqliteThresholdRepository();
  private settingsRepository = new SqliteSettingsRepository();

  private storageService = new FileSystemStorageService();

  private correctionLog = new JsonlCorrectionLog();
  private correctionRepository = new SqliteCorrectionRepository(this.correctionLog);

  private learningLoopService = new LearningLoopService(
    this.correctionRepository,
    this.documentRepository
  );

  private classifierService = new OpenAIClassifierService(this.learningLoopService);
  private extractorService = new OpenAIExtractorService(this.learningLoopService);

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
      this.storageService,
      this.thresholdRepository
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
      this.correctionRepository,
      this.thresholdRepository
    );
  }

  getUpdateThresholdsUseCase(): UpdateThresholdsUseCase {
    return new UpdateThresholdsUseCase(
      this.thresholdRepository
    );
  }

  getGetSettingsUseCase(): GetSettingsUseCase {
    return new GetSettingsUseCase(
      this.settingsRepository
    );
  }

  getUpdateSettingsUseCase(): UpdateSettingsUseCase {
    return new UpdateSettingsUseCase(
      this.settingsRepository
    );
  }

  getLearningLoopService(): LearningLoopService {
    return this.learningLoopService;
  }

  getCorrectionLog(): JsonlCorrectionLog {
    return this.correctionLog;
  }

  getDocumentRepository() {
    return this.documentRepository;
  }

  getExtractionRepository() {
    return this.extractionRepository;
  }

  getCorrectionRepository() {
    return this.correctionRepository;
  }

  getThresholdRepository() {
    return this.thresholdRepository;
  }

  getSettingsRepository() {
    return this.settingsRepository;
  }

  getStorageService() {
    return this.storageService;
  }

  getDocumentController(): DocumentController {
    return new DocumentController(
      this.getProcessDocumentUseCase(),
      this.getGetDocumentUseCase(),
      this.getCorrectDocumentUseCase()
    );
  }
}

export const container = new Container();
