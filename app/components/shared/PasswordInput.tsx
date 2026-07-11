import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";

/** A password `<input>` with a show/hide toggle. Forwards its ref so it works with react-hook-form's `register`. */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function PasswordInput({ className = "", ...props }, ref) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`${className} pe-10`}
        {...props}
      />
      <Tooltip
        content={visible ? t("actions.hidePassword") : t("actions.showPassword")}
        position="start"
        className="absolute inset-y-0 inset-e-2"
      >
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-base-content/50 hover:text-base-content grid cursor-pointer place-items-center"
          aria-label={visible ? t("actions.hidePassword") : t("actions.showPassword")}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </Tooltip>
    </div>
  );
});
