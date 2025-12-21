import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

const DashboardPagination = ({ totalPages, page, handlePageChange }: { totalPages: number; page: number; handlePageChange: (page: number) => void }) => {
	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className='flex justify-end pt-2'>
			<Pagination>
				<PaginationContent>
					<PaginationItem className='cursor-pointer'>
						<PaginationPrevious
							onClick={() => handlePageChange(page - 1)}
							aria-label='Previous page'
							className={page === 1 ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>

					{Array.from({ length: totalPages }, (_, i) => i + 1)
						.filter((pageNumber) => pageNumber === 1 || pageNumber === totalPages || (pageNumber >= page - 2 && pageNumber <= page + 2))
						.map((pageNumber, index, arr) => {
							const isGap = arr[index - 1] && pageNumber > arr[index - 1] + 1;
							return (
								<>
									{isGap && <PaginationItem key={`gap-${index}`}>...</PaginationItem>}
									<PaginationItem key={pageNumber} className='cursor-pointer'>
										<PaginationLink
											className={`${page === pageNumber && "bg-primary text-primary-foreground"}`}
											isActive={page === pageNumber}
											onClick={() => handlePageChange(pageNumber)}
										>
											{pageNumber}
										</PaginationLink>
									</PaginationItem>
								</>
							);
						})}

					<PaginationItem className='cursor-pointer'>
						<PaginationNext
							onClick={() => handlePageChange(page + 1)}
							aria-label='Next page'
							className={page === totalPages ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
};

export default DashboardPagination;
