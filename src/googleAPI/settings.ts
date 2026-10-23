export interface OgTaskSettings {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
  tokenExpiry: number;
}

export const DEFAULT_SETTINGS: OgTaskSettings = {
  clientId: "", clientSecret: "", refreshToken: "", accessToken: "", tokenExpiry: 0,
};