"use client";

import { useMemo, useState } from "react";

export function getPageItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push("ellipsis");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

export function usePagination(totalItems: number, pageSize = 10, initialPage = 1) {
  const [rawPage, setRawPage] = useState(initialPage);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);

  // Derive a safe page without useEffect so callers never see an out-of-range page
  const page = Math.min(Math.max(1, rawPage), totalPages);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);

  function goTo(target: number) {
    const clamped = Math.min(Math.max(1, target), totalPages);
    setRawPage(clamped);
  }
  function goPrev() {
    setRawPage((p) => Math.max(1, p - 1));
  }
  function goNext() {
    setRawPage((p) => Math.min(totalPages, p + 1));
  }

  return {
    page,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    pageItems,
    goTo,
    goPrev,
    goNext,
    setPage: goTo,
  };
}
