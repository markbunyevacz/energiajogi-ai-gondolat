
import { Button } from "@/components/ui/button";
import { TestCategory } from './types';

interface TestCategoryFilterProps {
  categories: TestCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function TestCategoryFilter({ categories, selectedCategory, onCategoryChange }: TestCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(category => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
        >
          {category.icon} {category.name}
        </Button>
      ))}
    </div>
  );
}
