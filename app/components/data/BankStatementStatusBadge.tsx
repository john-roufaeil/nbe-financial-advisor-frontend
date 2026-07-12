import { useEffect, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import { Loader2, TriangleAlert, CircleCheck, ClockCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BankStatement } from "@/types/bank-statement";

const PROCESSED_BADGE_DURATION_MS = 5000;
const PROCESSED_BADGE_FADE_MS = 400;

function StatusPill({
  tone,
  icon: Icon,
  spin,
  label,
  style,
  className = "",
}: {
  tone: string;
  icon: ComponentType<{ className?: string; "data-no-flip"?: boolean }>;
  spin?: boolean;
  label: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone} ${className}`}
    >
      <Icon data-no-flip className={`size-3.5 ${spin ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

export function BankStatementStatusBadge({ doc }: { doc: BankStatement }) {
  const { t } = useTranslation();
  const [showProcessed, setShowProcessed] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!doc.approved || !doc.approvedAt) {
      setShowProcessed(false);
      return;
    }
    const elapsed = Date.now() - doc.approvedAt;
    const remaining = PROCESSED_BADGE_DURATION_MS - elapsed;
    if (remaining <= 0) {
      setShowProcessed(false);
      return;
    }
    setShowProcessed(true);
    setFading(false);
    const fadeTimer = setTimeout(
      () => setFading(true),
      Math.max(remaining - PROCESSED_BADGE_FADE_MS, 0),
    );
    const hideTimer = setTimeout(() => setShowProcessed(false), remaining);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [doc.approved, doc.approvedAt]);

  if (doc.status === "uploading" || doc.status === "processing") {
    return (
      <StatusPill
        tone="bg-info/10 text-info"
        icon={Loader2}
        spin
        label={t(`data.bankStatementStatus.${doc.status}`)}
      />
    );
  }
  if (doc.status === "failed") {
    return (
      <StatusPill
        tone="bg-error/10 text-error"
        icon={TriangleAlert}
        label={t("data.bankStatementStatus.failed")}
      />
    );
  }
  if (!doc.approved) {
    return (
      <StatusPill
        tone="bg-warning/10 text-warning"
        icon={ClockCheck}
        label={t("data.bankStatementStatus.pendingApproval")}
      />
    );
  }
  if (!showProcessed) return null;
  return (
    <StatusPill
      tone="bg-success/10 text-success"
      icon={CircleCheck}
      label={t("data.bankStatementStatus.processed")}
      style={{ transitionDuration: `${PROCESSED_BADGE_FADE_MS}ms` }}
      className={`transition-opacity ${fading ? "opacity-0" : "opacity-100"}`}
    />
  );
}
