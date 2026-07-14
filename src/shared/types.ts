export type AppResult = {
  packageName: string;
  appName: string;
  iconUrl: string;
  shortDescription: string;
  rating: number;
  downloadsText: string;
};

export type SearchResponse = {
  apps: AppResult[];
  hasMore: boolean;
};
