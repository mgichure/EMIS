'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Intake, Program } from '@/lib/database';

export interface AdmissionFilters {
  search: string;
  status: string;
  intakeId: string;
  programId: string;
  dateFrom: string;
  dateTo: string;
}

interface AdmissionFiltersProps {
  filters: AdmissionFilters;
  onFiltersChange: (filters: AdmissionFilters) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const AdmissionFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  totalResults 
}: AdmissionFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch available intakes and programs
  const intakes = useLiveQuery(() => db.intakes.toArray());
  const programs = useLiveQuery(() => db.programs.toArray());

  const updateFilter = (key: keyof AdmissionFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const clearAllFilters = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {totalResults} results
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Intake */}
            <div className="space-y-2">
              <Label htmlFor="intake">Intake</Label>
              <Select value={filters.intakeId} onValueChange={(value) => updateFilter('intakeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Intakes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Intakes</SelectItem>
                  {intakes?.map((intake) => (
                    <SelectItem key={intake.id} value={intake.id!}>
                      {intake.name} ({intake.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Program */}
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select value={filters.programId} onValueChange={(value) => updateFilter('programId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Programs</SelectItem>
                  {programs?.map((program) => (
                    <SelectItem key={program.id} value={program.id!}>
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Active Filters:</span>
                {filters.search && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Search: {filters.search}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('search', '')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Status: {filters.status.replace('_', ' ')}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('status', '')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.intakeId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Intake: {intakes?.find(i => i.id === filters.intakeId)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('intakeId', '')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.programId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Program: {programs?.find(p => p.id === filters.programId)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('programId', '')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Date: {filters.dateFrom} - {filters.dateTo}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateFilter('dateFrom', '');
                        updateFilter('dateTo', '');
                      }}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
