"use client";

import { AlertTriangle, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ErrorState({
  title = "DATA SOURCE UNAVAILABLE",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-idic-red/30 bg-idic-red/5 p-8 text-center">
      <AlertTriangle className="text-idic-red" size={28} aria-hidden />
      <div className="text-sm font-semibold tracking-wide">{title}</div>
      {message && <p className="max-w-sm text-sm text-slate-400">{message}</p>}

      {/* KUNCI: Hanya render jika onRetry ada */}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-idic-border bg-idic-card/50 p-8 text-center">
      <Inbox className="text-slate-500" size={28} aria-hidden />
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <p className="max-w-sm text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-idic-border bg-idic-card p-5">
      <Skeleton className="h-4 w-28 bg-idic-border/60" />
      <Skeleton className="h-9 w-20 bg-idic-border/60" />
      <Skeleton className="h-3 w-36 bg-idic-border/60" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-2xl border border-idic-border bg-idic-card p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full bg-idic-border/60" />
      ))}
    </div>
  );
}
