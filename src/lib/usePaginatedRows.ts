import { useEffect, useMemo, useState } from 'react';

export function usePaginatedRows<T>(rows: T[] | undefined, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalItems = rows?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [totalItems]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (rows ?? []).slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    paginatedRows,
    setPage,
  };
}
