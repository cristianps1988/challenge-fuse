export interface UpdateSettingsResponse {
  success: boolean;
  updatedSettings: Record<string, string>;
  updatedAt: Date;
  message: string;
}
