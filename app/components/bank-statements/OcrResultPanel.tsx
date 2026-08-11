import { Download, ScanText } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useStatementOcrResult,
  useDownloadStatementOcrArtifact,
} from "@/queries/bank-statements";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { formatDateTime } from "@/lib/format";
import { Tooltip } from "@/components/shared/Tooltip";

/**
 * OCR engine/confidence/timestamp for a statement, plus a button to download
 * the extracted document.md. Only rendered once the raw pipeline stage has
 * reached "extracted" or later — pass `enabled` accordingly (BankStatement's
 * collapsed UI status doesn't distinguish "extracted" from "normalized", so
 * the caller uses `status === "processed"` as the gate, which covers both).
 */
export function OcrResultPanel({ statementId }: { statementId: string }) {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const { data: ocrResult } = useStatementOcrResult(statementId, true);
  const downloadArtifact = useDownloadStatementOcrArtifact();

  if (!ocrResult) return null;

  async function handleDownload() {
    const blob = await downloadArtifact.mutateAsync(statementId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${statementId}-document.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="border-base-300 bg-base-200/30 flex items-center gap-2 rounded-lg border p-3 text-xs">
      <span className="bg-base-100 text-base-content/50 grid size-8 shrink-0 place-items-center rounded-full">
        <ScanText className="size-4" />
      </span>
      <div className="text-base-content/60 min-w-0 flex-1">
        <p>
          {t("bankStatements.ocr.engine", { engine: ocrResult.ocrEngine })}
          {ocrResult.confidenceScore !== null &&
            ` · ${t("bankStatements.ocr.confidence", { percent: Math.round(ocrResult.confidenceScore * 100) })}`}
        </p>
        <p className="text-base-content/40">
          {formatDateTime(ocrResult.processedAt, timeFormat, t, dateFormat)}
        </p>
      </div>
      <Tooltip content={t("bankStatements.ocr.download")}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloadArtifact.isPending}
          aria-label={t("bankStatements.ocr.download")}
          className="btn btn-ghost btn-sm btn-circle shrink-0"
        >
          {downloadArtifact.isPending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Download data-no-flip className="size-4" />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
