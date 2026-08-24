/**
 * dsh-model-provider - effort pane: the current model's reasoning levels
 * plus an explicit "provider default" row when the model carries no default.
 */
import { IconCheckOutline16 } from "@deepseek-ai/dsh-client-ui-primitives";
import type { EffortChoice } from "../model/types.ts";

export interface EffortPaneProps {
  levels: EffortChoice[];
  effectiveEffort: string | undefined;
  busy: boolean;
  /** Directory load error banner (loading is reflected via aria-busy). */
  errorBlock: React.ReactNode;
  onPick: (effort: string | undefined) => void;
  registerRef: (node: HTMLButtonElement | null) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function EffortPane({ levels, effectiveEffort, busy, errorBlock, onPick, registerRef, t }: EffortPaneProps) {
  if (levels.length === 0) {
    return <div className="dshmp-empty">{t("empty.efforts")}</div>;
  }
  return (
    <>
      {errorBlock}
      {levels.map((level) => {
        const selected = effectiveEffort === level.effort;
        return (
          <button
            ref={(node) => registerRef(node)}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            className={selected ? "dshmp-option dshmp-selected" : "dshmp-option"}
            disabled={busy}
            key={level.key}
            onClick={() => onPick(level.effort)}
          >
            <span className="dshmp-optionCopy">
              <span className="dshmp-modelName">{level.label}</span>
              {level.description !== undefined && <span className="dshmp-description">{level.description}</span>}
            </span>
            <span className="dshmp-check">{selected ? <IconCheckOutline16 /> : null}</span>
          </button>
        );
      })}
    </>
  );
}
