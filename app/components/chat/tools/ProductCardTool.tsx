import { z } from "zod";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";

/** Matches the real `widget.payload` for `product_card` — see
 * ai-service/app/features/chat/schemas/widgets.py's ProductCardPayload,
 * built in agents/recommendation.py. Field names (product_id, product_name,
 * similarity) match that schema exactly, unlike allocation_slider's payload
 * below which predates it and was never reconciled. Validated at runtime,
 * not just asserted: `result` is LLM-originated, a meaningfully less
 * trustworthy source than a typed REST response. */
const ProductCardPayloadSchema = z.object({
  products: z.array(
    z.object({
      product_id: z.string(),
      product_name: z.string(),
      similarity: z.number(),
    }),
  ),
});

export const ProductCardTool: ToolCallMessagePartComponent = ({ result }) => {
  const { t } = useTranslation();
  const parsed = ProductCardPayloadSchema.safeParse(result);

  // undefined result: still streaming in, render nothing yet. Present but
  // malformed: a genuine payload/shape mismatch worth surfacing.
  if (result !== undefined && !parsed.success) return <ToolPayloadError />;
  if (!parsed.success || parsed.data.products.length === 0) return null;
  const data = parsed.data;

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
