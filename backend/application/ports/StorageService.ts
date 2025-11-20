export interface StorageService {
  save(fileBuffer: Buffer, fileName: string): Promise<string>;

  retrieve(filePath: string): Promise<Buffer>;

  delete(filePath: string): Promise<void>;

  exists(filePath: string): Promise<boolean>;

  getFileSize(filePath: string): Promise<number>;
}
