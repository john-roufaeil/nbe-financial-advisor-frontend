import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Matches the real `widget.payload` for `product_card` — see
 * ai-service/app/features/chat/schemas/widgets.py's ProductCardPayload,
 * built in agents/recommendation.py. Field names (product_id, product_name,
 * similarity) match that schema exactly, unlike allocation_slider's payload
 * below which predates it and was never reconciled. */
interface ProductCardPayload {
  products: { product_id: string; product_name: string; similarity: number }[];
}

export const ProductCardTool: ToolCallMessagePartComponent = ({ result }) => {
  const { t } = useTranslation();
  const data = result as ProductCardPayload | undefined;

  if (!data || data.products.length === 0) return null;

  return (
    <div className="border-base-300 bg-base-100 animate-entry my-2 flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
          <Package className="size-4" />
        </span>
        <p className="text-sm font-semibold">{t("chat.tools.products.title")}</p>
      </div>

      <div className="flex flex-col gap-2">
        {data.products.map((product) => (
          <div
            key={product.product_id}
            className="border-base-300 flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <span className="text-sm font-medium">{product.product_name}</span>
            <span className="badge badge-primary badge-outline shrink-0 text-xs">
              {t("chat.tools.products.match", {
                percent: Math.round(product.similarity * 100),
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
