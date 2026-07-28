import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import styles from "./Button.module.css";

export interface ButtonProps extends AriaButtonProps {
  tone?: "accent" | "quiet";
}

export function Button({ tone = "accent", ...props }: ButtonProps) {
  return <AriaButton {...props} className={`${styles.button} ${styles[tone]}`} />;
}
