export type SkeletonRow =
  | { kind: "text"; width?: string }
  | { kind: "field"; labelWidth?: string }
  | { kind: "progress"; trailingText?: boolean }
  | { kind: "fieldGrid"; fields: number }
  | { kind: "timeline"; milestones?: number };

function SkeletonTextRow({ width = "w-2/3" }: { width?: string }) {
  return <div className={`bg-base-200 h-3.5 ${width} animate-pulse rounded`} />;
}

function SkeletonFieldRow({ labelWidth = "w-1/4" }: { labelWidth?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`bg-base-200 h-3 ${labelWidth} animate-pulse rounded`} />
      <div className="bg-base-200 h-5 w-full animate-pulse rounded" />
    </div>
  );
}

function SkeletonProgressRow({ trailingText }: { trailingText?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="bg-base-200 h-3.5 w-1/4 animate-pulse rounded" />
        <div className="bg-base-200 h-3.5 w-1/3 animate-pulse rounded" />
      </div>
      <div className="bg-base-200 h-2 w-full animate-pulse rounded-full" />
      {trailingText && <div className="bg-base-200 h-3 w-2/5 animate-pulse rounded" />}
    </div>
  );
}

export function SkeletonTimelineRow({ milestones = 4 }: { milestones?: number }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <div className="bg-base-200 h-8 w-24 animate-pulse rounded" />
        <div className="bg-base-200 h-3.5 w-40 animate-pulse rounded" />
      </div>

      <div className="relative flex flex-col gap-8">
        <div className="bg-base-200 absolute start-[13px] top-[14px] bottom-[14px] w-[2px] rounded-full" />

        {Array.from({ length: milestones }, (_, i) => (
          <div
            key={i}
            className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4"
          >
            <div className="bg-base-200 border-base-100 z-10 size-7 animate-pulse rounded-full border-4" />

            <div className="flex flex-col gap-1.5">
              <div className="bg-base-200 h-3.5 w-12 animate-pulse rounded" />
              <div className="bg-base-200 h-3 w-16 animate-pulse rounded" />
            </div>

            <div className="bg-base-200 h-5 w-14 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRowItem({ row }: { row: SkeletonRow }) {
  switch (row.kind) {
    case "text":
      return <SkeletonTextRow width={row.width} />;
    case "field":
      return <SkeletonFieldRow labelWidth={row.labelWidth} />;
    case "progress":
      return <SkeletonProgressRow trailingText={row.trailingText} />;
    case "timeline":
      return <SkeletonTimelineRow milestones={row.milestones} />;
    case "fieldGrid":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: row.fields }, (_, i) => (
            <SkeletonFieldRow key={i} />
          ))}
        </div>
      );
  }
}
