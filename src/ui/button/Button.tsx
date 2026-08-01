import { forwardRef } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import styles from "./Button.module.css";

export interface ButtonProps extends AriaButtonProps {
  tone?: "accent" | "quiet";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone = "accent", ...props },
  ref,
) {
  return <AriaButton {...props} ref={ref} className={`${styles.button} ${styles[tone]}`} />;
});
