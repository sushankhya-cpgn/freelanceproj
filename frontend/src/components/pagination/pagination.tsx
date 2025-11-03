import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const JobPagination = () => {
  return (
    <div className="mt-8">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" className="border-border hover:bg-accent hover:text-accent-foreground" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive className="bg-primary text-primary-foreground">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" className="border-border hover:bg-accent hover:text-accent-foreground">
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" className="border-border hover:bg-accent hover:text-accent-foreground">
              3
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" className="border-border hover:bg-accent hover:text-accent-foreground">
              10
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" className="border-border hover:bg-accent hover:text-accent-foreground" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
