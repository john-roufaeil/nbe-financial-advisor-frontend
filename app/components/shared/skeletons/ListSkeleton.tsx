import { LoadingAnnouncement } from "@/components/shared/skeletons/LoadingAnnouncement";

/** A row-shaped pulse placeholder for list content — reduces layout shift and reads as "loading this list" rather than a generic blocking spinner. */
export function ListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      <LoadingAnnouncement />
      <ul className="animate-entry flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="border-base-300 bg-base-100 flex items-center gap-3 rounded-xl border p-3"
          >
            <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="bg-base-200 h-3.5 w-2/5 animate-pulse rounded" />
              <div className="bg-base-200 h-3 w-3/5 animate-pulse rounded" />
            </div>
            <div className="bg-base-200 h-4 w-14 shrink-0 animate-pulse rounded" />
          </li>
        ))}
      </ul>
    </>
  );
}
