/**
 * CurseForge API Client for Hytale Mod Management
 * Docs: https://docs.curseforge.com/rest-api/
 */

const CURSEFORGE_API_BASE = 'https://api.curseforge.com';
const HYTALE_GAME_ID = process.env.CURSEFORGE_GAME_ID || '73247'; // Hytale game ID
const MOD_CLASS_ID = process.env.CURSEFORGE_MOD_CLASS_ID || '1'; // Mods class

export interface CurseForgeMod {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  links: {
    websiteUrl: string;
    wikiUrl?: string;
    issuesUrl?: string;
    sourceUrl?: string;
  };
  summary: string;
  status: number;
  downloadCount: number;
  isFeatured: boolean;
  primaryCategoryId: number;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    iconUrl: string;
  }>;
  authors: Array<{
    id: number;
    name: string;
    url: string;
  }>;
  logo: {
    id: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string;
  };
  screenshots: Array<{
    id: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string;
  }>;
  mainFileId: number;
  latestFiles: CurseForgeFile[];
  dateCreated: string;
  dateModified: string;
  dateReleased: string;
  allowModDistribution?: boolean;
  gamePopularityRank: number;
}

export interface CurseForgeFile {
  id: number;
  gameId: number;
  modId: number;
  isAvailable: boolean;
  displayName: string;
  fileName: string;
  releaseType: 1 | 2 | 3; // 1: release, 2: beta, 3: alpha
  fileStatus: number;
  hashes: Array<{
    value: string;
    algo: number;
  }>;
  fileDate: string;
  fileLength: number;
  downloadCount: number;
  downloadUrl: string | null;
  gameVersions: string[];
  sortableGameVersions: Array<{
    gameVersionName: string;
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionTypeId: number;
  }>;
  dependencies: Array<{
    modId: number;
    relationType: 1 | 2 | 3; // 1: embedded, 2: optional, 3: required
  }>;
  alternateFileId?: number;
  isServerPack?: boolean;
  fileFingerprint: number;
  modules: Array<{
    name: string;
    fingerprint: number;
  }>;
}

export interface CurseForgeSearchParams {
  searchFilter?: string;
  gameVersion?: string;
  categoryId?: number;
  sortField?: 'Featured' | 'Popularity' | 'LastUpdated' | 'Name' | 'Author' | 'TotalDownloads';
  sortOrder?: 'asc' | 'desc';
  modLoaderType?: number;
  gameVersionTypeId?: number;
  authorId?: number;
  pageSize?: number;
  index?: number;
}

export interface CurseForgeSearchResponse {
  data: CurseForgeMod[];
  pagination: {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
  };
}

export interface CurseForgeModResponse {
  data: CurseForgeMod;
}

export interface CurseForgeFilesResponse {
  data: CurseForgeFile[];
  pagination: {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
  };
}

export interface CurseForgeFileResponse {
  data: CurseForgeFile;
}

export interface CurseForgeDownloadUrlResponse {
  data: string;
}

export interface CurseForgeCategory {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  url: string;
  iconUrl: string;
  dateModified: string;
  isClass: boolean;
  classId: number;
  parentCategoryId: number;
  displayIndex: number;
}

export interface CurseForgeCategoriesResponse {
  data: CurseForgeCategory[];
}

/**
 * CurseForge API Client
 */
export class CurseForgeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CURSEFORGE_API_KEY || '';
    this.baseUrl = CURSEFORGE_API_BASE;

    if (!this.apiKey) {
      throw new Error('CurseForge API key is required');
    }
  }

  /**
   * Make authenticated request to CurseForge API
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for mods
   */
  async searchMods(params: CurseForgeSearchParams = {}): Promise<CurseForgeSearchResponse> {
    const searchParams = new URLSearchParams({
      gameId: HYTALE_GAME_ID,
      classId: MOD_CLASS_ID,
      ...(params.searchFilter && { searchFilter: params.searchFilter }),
      ...(params.gameVersion && { gameVersion: params.gameVersion }),
      ...(params.categoryId && { categoryId: params.categoryId.toString() }),
      ...(params.sortField && { sortField: params.sortField }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.modLoaderType && { modLoaderType: params.modLoaderType.toString() }),
      ...(params.gameVersionTypeId && { gameVersionTypeId: params.gameVersionTypeId.toString() }),
      ...(params.authorId && { authorId: params.authorId.toString() }),
      pageSize: (params.pageSize || 20).toString(),
      index: (params.index || 0).toString(),
    });

    return this.request<CurseForgeSearchResponse>(`/v1/mods/search?${searchParams}`);
  }

  /**
   * Get a single mod by ID
   */
  async getMod(modId: number): Promise<CurseForgeModResponse> {
    return this.request<CurseForgeModResponse>(`/v1/mods/${modId}`);
  }

  /**
   * Get multiple mods by IDs
   */
  async getMods(modIds: number[]): Promise<{ data: CurseForgeMod[] }> {
    return this.request<{ data: CurseForgeMod[] }>(`/v1/mods`, {
      method: 'POST',
      body: JSON.stringify({ modIds }),
    });
  }

  /**
   * Get mod description (HTML)
   */
  async getModDescription(modId: number): Promise<{ data: string }> {
    return this.request<{ data: string }>(`/v1/mods/${modId}/description`);
  }

  /**
   * Get all files for a mod
   */
  async getModFiles(modId: number, params?: {
    gameVersion?: string;
    modLoaderType?: number;
    pageSize?: number;
    index?: number;
  }): Promise<CurseForgeFilesResponse> {
    const searchParams = new URLSearchParams({
      ...(params?.gameVersion && { gameVersion: params.gameVersion }),
      ...(params?.modLoaderType && { modLoaderType: params.modLoaderType.toString() }),
      pageSize: (params?.pageSize || 50).toString(),
      index: (params?.index || 0).toString(),
    });

    return this.request<CurseForgeFilesResponse>(`/v1/mods/${modId}/files?${searchParams}`);
  }

  /**
   * Get a specific mod file
   */
  async getModFile(modId: number, fileId: number): Promise<CurseForgeFileResponse> {
    return this.request<CurseForgeFileResponse>(`/v1/mods/${modId}/files/${fileId}`);
  }

  /**
   * Get download URL for a file
   */
  async getFileDownloadUrl(modId: number, fileId: number): Promise<string> {
    const response = await this.request<CurseForgeDownloadUrlResponse>(
      `/v1/mods/${modId}/files/${fileId}/download-url`
    );
    return response.data;
  }

  /**
   * Get categories for Hytale
   */
  async getCategories(): Promise<CurseForgeCategoriesResponse> {
    return this.request<CurseForgeCategoriesResponse>(
      `/v1/categories?gameId=${HYTALE_GAME_ID}`
    );
  }

  /**
   * Get featured mods
   */
  async getFeaturedMods(excludedModIds: number[] = []): Promise<{ data: CurseForgeMod[] }> {
    return this.request<{ data: CurseForgeMod[] }>(`/v1/mods/featured`, {
      method: 'POST',
      body: JSON.stringify({
        gameId: parseInt(HYTALE_GAME_ID),
        excludedModIds,
      }),
    });
  }
}

// Singleton instance
let curseforgeClient: CurseForgeClient | null = null;

export function getCurseForgeClient(): CurseForgeClient {
  if (!curseforgeClient) {
    curseforgeClient = new CurseForgeClient();
  }
  return curseforgeClient;
}

export function isCurseForgeConfigured(): boolean {
  return !!process.env.CURSEFORGE_API_KEY;
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper function to get release type label
 */
export function getReleaseTypeLabel(releaseType: 1 | 2 | 3): string {
  switch (releaseType) {
    case 1: return 'Release';
    case 2: return 'Beta';
    case 3: return 'Alpha';
    default: return 'Unknown';
  }
}

/**
 * Helper function to get release type color
 */
export function getReleaseTypeColor(releaseType: 1 | 2 | 3): string {
  switch (releaseType) {
    case 1: return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 2: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 3: return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}
