/**
 * CurseForge API Type Definitions
 */

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
  isClass?: boolean;
  classId?: number;
  parentCategoryId?: number;
  displayIndex?: number;
}

export interface CurseForgeCategoriesResponse {
  data: CurseForgeCategory[];
}

export interface FeaturedModsResponse {
  data: {
    featured: CurseForgeMod[];
    popular: CurseForgeMod[];
    recentlyUpdated: CurseForgeMod[];
  };
}
