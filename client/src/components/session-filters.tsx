import { useState } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FilterState {
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  rifle?: string;
  distance?: number;
}

interface SessionFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export default function SessionFilters({ onFiltersChange }: SessionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({});

  const updateFilter = (key: keyof FilterState, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Filter className="mr-2 text-primary" size={20} />
          Filters
        </h3>
        
        {/* Search */}
        <div className="mb-4">
          <Label className="text-sm font-medium text-slate-700 mb-2">Search Sessions</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Session name..."
              className="pl-10"
              value={filters.name || ''}
              onChange={(e) => updateFilter('name', e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          </div>
        </div>

        {/* Date Range */}
        <div className="mb-4">
          <Label className="text-sm font-medium text-slate-700 mb-2">Date Range</Label>
          <div className="space-y-2">
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>
        </div>

        {/* Range Filter */}
        <div className="mb-4">
          <Label className="text-sm font-medium text-slate-700 mb-2">Distance</Label>
          <Select onValueChange={(value) => updateFilter('distance', value ? Number(value) : undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="All Distances" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Distances</SelectItem>
              <SelectItem value="100">100 yards</SelectItem>
              <SelectItem value="200">200 yards</SelectItem>
              <SelectItem value="300">300 yards</SelectItem>
              <SelectItem value="500">500 yards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rifle Filter */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-slate-700 mb-2">Rifle</Label>
          <Input
            type="text"
            placeholder="Rifle name..."
            value={filters.rifle || ''}
            onChange={(e) => updateFilter('rifle', e.target.value)}
          />
        </div>

        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <RotateCcw className="mr-2" size={16} />
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}
