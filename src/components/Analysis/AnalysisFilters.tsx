
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from 'lucide-react';

interface AnalysisFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterRisk: string;
  onFilterRiskChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function AnalysisFilters({
  searchTerm,
  onSearchChange,
  filterRisk,
  onFilterRiskChange,
  sortBy,
  onSortByChange
}: AnalysisFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Szerződés keresése..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterRisk} onValueChange={onFilterRiskChange}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Kockázat szűrése" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden kockázat</SelectItem>
              <SelectItem value="high">Magas</SelectItem>
              <SelectItem value="medium">Közepes</SelectItem>
              <SelectItem value="low">Alacsony</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Rendezés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Dátum szerint</SelectItem>
              <SelectItem value="risk">Kockázat szerint</SelectItem>
              <SelectItem value="contract">Szerződés szerint</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
