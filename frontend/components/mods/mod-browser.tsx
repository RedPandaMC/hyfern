'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModCard } from './mod-card';
import type { CurseForgeMod, CurseForgeCategory } from '@/types/curseforge';

interface ModBrowserProps {
  onInstall: (mod: CurseForgeMod) => void;
  installedModIds: number[];
}

export function ModBrowser({ onInstall, installedModIds }: ModBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Popularity');
  const [mods, setMods] = useState<CurseForgeMod[]>([]);
  const [categories, setCategories] = useState<CurseForgeCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch mods when search parameters change
  useEffect(() => {
    fetchMods();
  }, [searchQuery, selectedCategory, sortBy, page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/mods/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchMods = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        q: searchQuery,
        sortBy: sortBy,
        page: page.toString(),
        pageSize: '20',
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/mods/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch mods');

      const data = await response.json();
      setMods(data.data || []);

      if (data.pagination) {
        const totalCount = data.pagination.totalCount;
        const pageSize = data.pagination.pageSize;
        setTotalPages(Math.ceil(totalCount / pageSize));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mods');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0); // Reset to first page
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(0); // Reset to first page
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(0); // Reset to first page
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4 bg-[#0C1222] border-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search mods..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-[#1a1f35] border-gray-700 text-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 bg-[#1a1f35] border border-gray-700 rounded-md text-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 bg-[#1a1f35] border border-gray-700 rounded-md text-white"
          >
            <option value="Popularity">Popularity</option>
            <option value="LastUpdated">Recently Updated</option>
            <option value="Name">Name</option>
            <option value="TotalDownloads">Downloads</option>
          </select>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <p className="text-red-500">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
        </div>
      )}

      {/* Mod Grid */}
      {!loading && mods.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mods.map((mod) => (
              <ModCard
                key={mod.id}
                mod={mod}
                isInstalled={installedModIds.includes(mod.id)}
                onInstall={() => onInstall(mod)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
                className="border-gray-700"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="border-gray-700"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && mods.length === 0 && (
        <Card className="p-12 bg-[#0C1222] border-gray-800">
          <div className="text-center">
            <p className="text-gray-400">No mods found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
