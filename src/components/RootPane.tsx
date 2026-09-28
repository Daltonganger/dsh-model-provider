/**
 * dsh-model-provider - root pane: 模型 / 推理等级.
 */
import { IconChevronRightOutlineRegular } from "@deepseek-ai/dsh-client-ui-primitives";

export interface RootPaneProps {
  modelLabel: string;
  effortLabel: string | undefined;
  /** Whether the current model exposes reasoning levels at all. */
  hasEffort: boolean;
  onOpenProvider: () => void;
  onOpenEffort: () => void;
  registerRef: (node: HTMLButtonElement | null) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function RootPane({ modelLabel, effortLabel, hasEffort, onOpenProvider, onOpenEffort, registerRef, t }: RootPaneProps) {
  return (
    <>
      <button
        ref={(node) => registerRef(node)}
        type="button"
        role="menuitem"
        className="dshmp-cell"
        onClick={onOpenProvider}
      >
        <span className="dshmp-cellLabel">{t("menu.model")}</span>
        <span className="dshmp-cellValue">{modelLabel}</span>
        <IconChevronRightOutlineRegular className="dshmp-cellChevron" />
      </button>
      {hasEffort && (
        <button
          ref={(node) => registerRef(node)}
          type="button"
          role="menuitem"
          className="dshmp-cell"
          onClick={onOpenEffort}
        >
          <span className="dshmp-cellLabel">{t("menu.effort")}</span>
          <span className="dshmp-cellValue">{effortLabel}</span>
          <IconChevronRightOutlineRegular className="dshmp-cellChevron" />
        </button>
      )}
    </>
  );
}
