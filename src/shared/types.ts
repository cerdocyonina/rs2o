export type AppResult = {
  packageName: string;
  appName: string;
  iconUrl: string;
  shortDescription: string;
  rating: number;
  downloadsText: string;
  // платные приложения Obtainium скачать не сможет — у него нет аккаунта RuStore
  isPaid: boolean;
};

export type SearchResponse = {
  apps: AppResult[];
  hasMore: boolean;
};
