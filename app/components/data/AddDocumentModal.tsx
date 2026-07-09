import { forwardRef, useState, type Ref } from "react";
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
  DOCUMENT_UPLOAD_ACCEPT,
  inferDocumentType,
  type DocumentType,
} from "@/types/document";
import { useUploadDocuments } from "@/queries/documents";
import { toastError } from "@/lib/toast";

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
    const [rejected, setRejected] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    function handleFiles(fileList: FileList | null) {
      if (!fileList) return;
      const nextStaged: StagedFile[] = [];
      const nextRejected: string[] = [];
      for (const file of Array.from(fileList)) {
        const type = inferDocumentType(file);
        if (type) nextStaged.push({ file, type });
        else nextRejected.push(file.name);
      }
      setStaged((s) => [...s, ...nextStaged]);
      setRejected(nextRejected);
    }

    function removeStaged(index: number) {
      setStaged((s) => s.filter((_, i) => i !== index));
    }

    function reset() {
      setStaged([]);
      setRejected([]);
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
      <dialog ref={ref} className="modal">
        <div className="modal-box relative flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              reset();
              closeDialog(ref);
            }}
            className="btn btn-ghost btn-sm btn-circle absolute end-2 top-2"
            aria-label={t("actions.close")}
          >
            <X data-no-flip className="size-4" />
          </button>
          <h3 className="text-lg font-semibold">{t("data.addDocument.title")}</h3>

          <label
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
            className={`hover:border-primary hover:bg-base-200 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragging ? "border-primary bg-base-200" : "border-base-300"
            }`}
          >
            <Upload className="text-base-content/40 size-6" />
            <span className="text-sm font-medium">{t("data.addDocument.dropzone")}</span>
            <span className="text-base-content/50 text-xs">
              {t("data.addDocument.accepted")}
            </span>
            <input
              type="file"
              multiple
              accept={DOCUMENT_UPLOAD_ACCEPT}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>

          {rejected.length > 0 && (
            <p className="text-warning flex items-center gap-1.5 text-xs">
              <TriangleAlert className="size-3.5 shrink-0" />
              {t("data.addDocument.rejected", { names: rejected.join(", ") })}
            </p>
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
                    <button
                      type="button"
                      onClick={() => removeStaged(i)}
                      className="btn btn-ghost btn-xs btn-square shrink-0"
                      aria-label={t("actions.delete", { name: file.name })}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="modal-action">
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
            <button
              type="button"
              disabled={staged.length === 0 || uploadDocuments.isPending}
              onClick={handleUpload}
              className="btn btn-primary"
            >
              {uploadDocuments.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t("actions.upload")
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button className="cursor-default">{t("actions.close")}</button>
        </form>
      </dialog>
    );
  },
);
