export interface CorrectDocumentResponse {
  correctionId: string;
  documentId: string;
  correctedAt: Date;
  success: boolean;
  message: string;
}
