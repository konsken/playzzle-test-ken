
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
};

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageClick = (pageNumber: number) => {
      if (onPageChange) {
        onPageChange(pageNumber);
      } else {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        router.push(`${pathname}?${params.toString()}`);
      }
  };

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pages = [];
  // Show first page, last page, and pages around current page
  const pageWindow = 2; // Show 2 pages before and after current
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - pageWindow && i <= currentPage + pageWindow)
    ) {
      pages.push(i);
    }
  }

  const renderedPages = [];
  let lastPage = 0;
  for (const page of pages) {
    if (lastPage + 1 < page) {
      renderedPages.push(<PaginationEllipsis key={`ellipsis-${lastPage}`} />);
    }
    renderedPages.push(
      <PaginationItem key={page}>
        <PaginationLink
          href={createPageURL(page)}
          isActive={page === currentPage}
          onClick={(e) => {
            e.preventDefault();
            handlePageClick(page);
          }}
        >
          {page}
        </PaginationLink>
      </PaginationItem>
    );
    lastPage = page;
  }


  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={createPageURL(currentPage - 1)}
            onClick={(e) => {
                e.preventDefault();
                handlePageClick(currentPage - 1);
            }}
            className={cn(currentPage === 1 ? 'pointer-events-none opacity-50' : '')}
            aria-disabled={currentPage === 1}
          />
        </PaginationItem>
        {renderedPages}
        <PaginationItem>
          <PaginationNext
            href={createPageURL(currentPage + 1)}
            onClick={(e) => {
                e.preventDefault();
                handlePageClick(currentPage + 1);
            }}
            className={cn(currentPage === totalPages ? 'pointer-events-none opacity-50' : '')}
            aria-disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
