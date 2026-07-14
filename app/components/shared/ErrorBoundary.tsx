import { Component, type ErrorInfo, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

interface Props extends WithTranslation {
  children: ReactNode;
  /** Optional feature-specific fallback; defaults to a generic retry panel. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * A local error boundary for a single feature area (e.g. chat, statement
 * extraction) so a rendering error there doesn't unmount the whole app —
 * only React Router's root ErrorBoundary catches route-render errors, not
 * errors thrown deeper in a mounted tree, and there's no hook equivalent.
 */
class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const { t } = this.props;
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertTriangle className="text-error size-8" />
          <p className="text-base-content/70 text-sm">{t("common.loadError")}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-outline btn-sm"
          >
            {t("common.retry")}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
