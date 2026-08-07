import { forwardRef } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import interactionStyles from "../interaction/Interaction.module.css";
import styles from "./Button.module.css";

export type ButtonTone = "accent" | "secondary" | "quiet" | "danger";

export interface ButtonProps extends AriaButtonProps {
  tone?: ButtonTone;
}

const toneStyles: Record<ButtonTone, string | undefined> = {
  accent: interactionStyles.primary,
  secondary: interactionStyles.secondary,
  quiet: interactionStyles.quiet,
  danger: interactionStyles.danger,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, tone = "accent", ...props },
  ref,
) {
  return (
    <AriaButton
      {...props}
      ref={ref}
      className={(state) =>
        [
          styles.button,
          interactionStyles.control,
          toneStyles[tone],
          typeof className === "function" ? className(state) : className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    />
  );
});
