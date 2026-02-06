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
  categories: CurseForgeCategory[];
  authors: CurseForgeAuthor[];
  logo: CurseForgeAsset;
  screenshots: CurseForgeAsset[];
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

export interface CurseForgeAuthor {
  id: number;
  name: string;
  url: string;
}

export interface CurseForgeAsset {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
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

export interface CurseForgePagination {
  index: number;
  pageSize: number;
  resultCount: number;
  totalCount: number;
}
