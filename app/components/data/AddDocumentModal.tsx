import { forwardRef, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  TriangleAlert,
} from "lucide-react";
import {
  DOCUMENT_MAX_SIZE_BYTES,
  DOCUMENT_MAX_SIZE_MB,
  DOCUMENT_UPLOAD_ACCEPT,
  inferDocumentType,
  type DocumentType,
} from "@/types/document";
import { useUploadDocuments } from "@/queries/documents";
import { toastError } from "@/lib/toast";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";
import { Tooltip } from "@/components/shared/Tooltip";

const TYPE_ICONS: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  doc: FileIcon,
};

function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}

interface StagedFile {
  file: File;
  type: DocumentType;
}

export const AddDocumentModal = forwardRef<HTMLDialogElement>(
  function AddDocumentModal(_props, ref) {
    const { t } = useTranslation();
    const uploadDocuments = useUploadDocuments();
    const [staged, setStaged] = useState<StagedFile[]>([]);
    const [rejectedType, setRejectedType] = useState<string[]>([]);
    const [rejectedSize, setRejectedSize] = useState<string[]>([]);
    const [rejectedExtra, setRejectedExtra] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Only one statement can be staged at a time — the first accepted file
    // wins and replaces whatever was staged before; anything else picked or
    // dropped alongside it is reported as skipped, with the specific reason
    // (unsupported type, too large, or simply extra) called out separately.
    function handleFiles(fileList: FileList | null) {
      if (!fileList) return;
      const files = Array.from(fileList);
      const nextRejectedType: string[] = [];
      const nextRejectedSize: string[] = [];
      const nextRejectedExtra: string[] = [];
      let nextStaged: StagedFile | undefined;
      for (const file of files) {
        const type = inferDocumentType(file);
        if (!type) {
          nextRejectedType.push(file.name);
        } else if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
          nextRejectedSize.push(file.name);
        } else if (!nextStaged) {
          nextStaged = { file, type };
        } else {
          nextRejectedExtra.push(file.name);
        }
      }
      setStaged(nextStaged ? [nextStaged] : []);
      setRejectedType(nextRejectedType);
      setRejectedSize(nextRejectedSize);
      setRejectedExtra(nextRejectedExtra);
    }

    function removeStaged() {
      setStaged([]);
    }

    function reset() {
      setStaged([]);
      setRejectedType([]);
      setRejectedSize([]);
      setRejectedExtra([]);
    }

    async function handleUpload() {
      if (staged.length === 0) return;
      const documents = staged.map(({ file, type }) => ({
        name: file.name,
        type,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        file,
      }));

      try {
        // Each file is its own request, so a batch can partially succeed —
        // a byte-identical re-upload is rejected while its siblings land.
        const uploaded = await uploadDocuments.mutateAsync(documents);
        if (uploaded.length < documents.length) {
          toastError("toast.documentsPartiallyUploaded");
        }
        reset();
        closeDialog(ref);
      } catch {
        // Every file failed. The mutation's onError toasted; stay open with the
        // staged list intact so the user can fix the selection and retry.
      }
    }

    return (
      <BaseModal
        ref={ref}
        onClose={reset}
        title={t("data.addDocument.title")}
        actions={
          <>
            <Button
              type="button"
              disabled={staged.length === 0 || uploadDocuments.isPending}
              loading={uploadDocuments.isPending}
              onClick={handleUpload}
              className="btn btn-primary"
            >
              {t("actions.upload")}
            </Button>
            <button
              type="button"
              onClick={() => {
                reset();
                closeDialog(ref);
              }}
              className="btn btn-ghost"
            >
              {t("actions.cancel")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <label
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`hover:border-primary hover:bg-base-200 focus-visible:outline-primary/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDragging ? "border-primary bg-base-200" : "border-base-300"
            }`}
          >
            <Upload className="text-base-content/40 size-6" />
            <span className="text-sm font-medium">{t("data.addDocument.dropzone")}</span>
            <span className="text-base-content/50 text-xs">
              {t("data.addDocument.accepted", { maxMb: DOCUMENT_MAX_SIZE_MB })}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={DOCUMENT_UPLOAD_ACCEPT}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>

          {(rejectedType.length > 0 ||
            rejectedSize.length > 0 ||
            rejectedExtra.length > 0) && (
            <div role="alert" className="flex flex-col gap-1">
              {rejectedType.length > 0 && (
                <p className="text-warning flex items-center gap-1.5 text-xs">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {t("data.addDocument.rejectedType", { names: rejectedType.join(", ") })}
                </p>
              )}
              {rejectedSize.length > 0 && (
                <p className="text-warning flex items-center gap-1.5 text-xs">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {t("data.addDocument.rejectedSize", {
                    maxMb: DOCUMENT_MAX_SIZE_MB,
                    names: rejectedSize.join(", "),
                  })}
                </p>
              )}
              {rejectedExtra.length > 0 && (
                <p className="text-warning flex items-center gap-1.5 text-xs">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {t("data.addDocument.rejectedExtra", {
                    names: rejectedExtra.join(", "),
                  })}
                </p>
              )}
            </div>
          )}

          {staged.length > 0 && (
            <ul className="flex flex-col gap-2">
              {staged.map(({ file, type }, i) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <li
                    key={`${file.name}-${i}`}
                    className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <span className="bg-info/10 text-info grid size-8 shrink-0 place-items-center rounded-lg">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                    <Tooltip
                      content={t("actions.delete", { name: file.name })}
                      className="shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => removeStaged()}
                        className="btn btn-ghost btn-xs btn-square"
                        aria-label={t("actions.delete", { name: file.name })}
                      >
                        <X className="size-3.5" />
                      </button>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </BaseModal>
    );
  },
);
