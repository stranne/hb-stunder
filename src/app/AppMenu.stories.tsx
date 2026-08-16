import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState, type ComponentProps } from "react";
import { fn, userEvent, within } from "storybook/test";
import { AppMenu } from "./AppMenu";

function InteractiveAppMenu(props: ComponentProps<typeof AppMenu>) {
  const [colorModePreference, setColorModePreference] = useState(props.colorModePreference);

  return (
    <AppMenu
      {...props}
      colorModePreference={colorModePreference}
      onColorModeChange={(preference) => {
        setColorModePreference(preference);
        props.onColorModeChange(preference);
      }}
    />
  );
}

const meta = {
  title: "Application/Shell/App menu",
  component: AppMenu,
  args: {
    customer: { customerId: "900001", displayName: "Anna Andersson" },
    canSignIn: true,
    onSignIn: fn(),
    onSignOut: fn(),
    colorModePreference: "system",
    onColorModeChange: fn(),
  },
  parameters: { layout: "centered" },
  render: (args) => <InteractiveAppMenu {...args} />,
} satisfies Meta<typeof AppMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
export const SignedInWithoutName: Story = { args: { customer: { customerId: "900001" } } };
export const SignedOut: Story = {
  args: { customer: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
export const SignInUnavailable: Story = {
  args: { customer: undefined, canSignIn: false },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
export const English: Story = { globals: { locale: "en" } };
export const Dark: Story = {
  args: { colorModePreference: "dark" },
  globals: { colorMode: "dark" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
