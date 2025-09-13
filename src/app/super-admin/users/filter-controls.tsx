
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserFilter } from './actions';

type FilterControlsProps = {
    counts: {
        all: number;
        superadmin: number;
        pro: number;
        standard: number;
    }
}

export function FilterControls({ counts }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';

  const filters: { label: string, value: UserFilter, count: number, className: string }[] = [
    { label: 'All Users', value: 'all', count: counts.all, className: 'hover:bg-accent hover:text-accent-foreground' },
    { label: 'Super Admin', value: 'superadmin', count: counts.superadmin, className: 'bg-destructive/80 text-destructive-foreground hover:bg-destructive' },
    { label: 'Pro', value: 'pro', count: counts.pro, className: 'bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:text-sky-950 dark:hover:bg-sky-600' },
    { label: 'Standard', value: 'standard', count: counts.standard, className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80' },
  ];

  const handleFilterChange = (filter: UserFilter) => {
    const params = new URLSearchParams(searchParams);
    params.set('filter', filter);
    params.set('page', '1'); // Reset to first page on filter change
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(filter => (
        <Button
            key={filter.value}
            variant={currentFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(filter.value)}
            className={cn(
                "flex items-center gap-2",
                currentFilter === filter.value ? filter.className : 'border'
            )}
        >
            <span>{filter.label}</span>
            <Badge 
                variant='secondary'
                className="px-1.5"
            >
                {filter.count}
            </Badge>
        </Button>
      ))}
    </div>
  );
}
