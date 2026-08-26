"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Disclaimer } from "@/components/common/disclaimer";
import { PageHeader } from "@/components/common/page-header";
import { EarthquakeDetail } from "@/components/earthquake/earthquake-detail";
import {
  EarthquakeFilterBar,
  type EarthquakeFilters,
} from "@/components/earthquake/earthquake-filter-bar";
import { EarthquakeKpis } from "@/components/earthquake/earthquake-kpis";
import { EarthquakeList } from "@/components/earthquake/earthquake-list";
import { useEarthquakePage } from "@/hooks/use-earthquakes";

const PAGE_SIZE = 20;

export default function EarthquakePage() {
  const router = useRouter();
  const [filters, setFilters] = useState<EarthquakeFilters>({
    hours: 24,
    minMagnitude: 0,
  });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const query = useEarthquakePage({
    hours: filters.hours,
    minMagnitude: filters.minMagnitude,
    page,
    pageSize: PAGE_SIZE,
  });

  const items = useMemo(() => query.data?.data.items ?? [], [query.data]);
  const total = query.data?.data.total ?? null;
  const totalPages =
    total !== null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  const selected = useMemo(
    () => items.find((eq) => eq.id === selectedId) ?? null,
    [items, selectedId],
  );

  // Preselect dari URL ?id= (berlaku jika event ada di halaman aktif)
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (id) {
      setSelectedId((prev) => prev ?? id);
    }
  }, []);

  const handleFilters = (next: EarthquakeFilters) => {
    setFilters(next);
    setPage(1); // filter berubah → kembali ke halaman 1
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
    router.replace(`/earthquake?id=${id}`, { scroll: false });
  };

  const clearSelection = () => {
    setSelectedId(null);
    router.replace("/earthquake", { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earthquake Monitoring"
        description="Data realtime gempa bumi BMKG & USGS — wilayah Indonesia"
      />

      <EarthquakeKpis hours={filters.hours} />

      <EarthquakeFilterBar
        filters={filters}
        onChange={handleFilters}
        total={total}
        loading={query.isLoading}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <EarthquakeList
            items={items}
            loading={query.isLoading}
            isFetching={query.isFetching}
            error={query.isError}
            errorMessage={
              query.error instanceof Error ? query.error.message : undefined
            }
            onRetry={() => void query.refetch()}
            selectedId={selectedId}
            onSelect={handleSelect}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        {/* Desktop: sticky detail panel */}
        <div className="hidden xl:block">
          <div className="sticky top-20">
            <EarthquakeDetail event={selected} />
          </div>
        </div>
      </div>

      <Disclaimer />

      {/* Mobile: bottom sheet saat event dipilih */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm xl:hidden"
          onClick={clearSelection}
          role="dialog"
          aria-modal="true"
          aria-label="Detail gempa"
        >
          <div
            className="max-h-[80dvh] w-full overflow-y-auto rounded-t-2xl border-t border-idic-border bg-idic-bg p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <EarthquakeDetail event={selected} onClose={clearSelection} />
          </div>
        </div>
      )}
    </div>
  );
}
