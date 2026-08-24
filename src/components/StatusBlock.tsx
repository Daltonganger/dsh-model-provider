/**
 * dsh-model-provider - directory status banner: loading hint and load-error
 * row with a retry action. Shared by the provider/model/effort panes so the
 * failure surface stays consistent (failed providers themselves are rendered
 * as rows by ProviderPane, not as banners here).
 */

export interface StatusBlockProps {
  loading: boolean;
  loadingText: string;
  /** Non-null only when the last action was a load and it failed. */
  errorText: string | null;
  onRetry: () => void;
  retryText: string;
}

export function StatusBlock({ loading, loadingText, errorText, onRetry, retryText }: StatusBlockProps) {
  return (
    <>
      {loading && <div className="dshmp-status">{loadingText}</div>}
      {errorText !== null && (
        <div className="dshmp-error">
          <span>{errorText}</span>
          <button type="button" className="dshmp-retry" onClick={onRetry}>
            {retryText}
          </button>
        </div>
      )}
    </>
  );
}
