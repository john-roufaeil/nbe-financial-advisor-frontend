import { LoadingAnnouncement } from "@/components/shared/skeletons/LoadingAnnouncement";

/** Two-row card placeholders matching the grid view of the data tables. */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <>
      <LoadingAnnouncement />
      <ul
        className="animate-entry grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
        aria-hidden="true"
      >
        {Array.from({ length: cards }, (_, i) => (
          <li
            key={i}
            className="border-base-300 bg-base-100 flex flex-col gap-3 rounded-xl border p-3"
          >
            <div className="flex items-center gap-3">
              <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="bg-base-200 h-3.5 w-2/5 animate-pulse rounded" />
                <div className="bg-base-200 h-3 w-3/5 animate-pulse rounded" />
              </div>
            </div>
            <div className="border-base-200 flex items-center justify-between border-t pt-2">
              <div className="bg-base-200 h-4 w-16 animate-pulse rounded" />
              <div className="flex gap-1">
                <div className="bg-base-200 size-7 animate-pulse rounded" />
                <div className="bg-base-200 size-7 animate-pulse rounded" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
