import type { Ref } from "react";

/** Closes the <dialog> behind a forwarded ref. Callback refs expose no
 * element handle, so those are a no-op — every dialog in the app forwards
 * an object ref. */
export function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}
