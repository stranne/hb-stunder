import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { ScheduleView } from "../model/scheduleSearch";
import { ScheduleViewControls, type ScheduleViewControlsProps } from "./ScheduleViewControls";

function InteractiveControls(props: ScheduleViewControlsProps) {
  const [view, setView] = useState<ScheduleView>(props.view);
  const [showFavorites, setShowFavorites] = useState(props.showFavorites);

  return (
    <ScheduleViewControls
      {...props}
      view={view}
      showFavorites={showFavorites}
      onViewChange={(nextView) => {
        setView(nextView);
        props.onViewChange(nextView);
      }}
      onShowFavoritesChange={(nextShowFavorites) => {
        setShowFavorites(nextShowFavorites);
        props.onShowFavoritesChange(nextShowFavorites);
      }}
    />
  );
}

const meta = {
  title: "Features/Schedule/Components/View controls",
  component: ScheduleViewControls,
  render: (args) => <InteractiveControls {...args} />,
  args: {
    view: "classes",
    activeFilterCount: 0,
    showFavorites: false,
    onOpenFilters: fn(),
    onShowFavoritesChange: fn(),
    onViewChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: "min(60rem, calc(100vw - 2rem))" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Pinned under the date strip: Filters opens the filter sheet and counts active filters, Favorites narrows the day to starred instructors and class types, and the switch moves between the list and the room calendar.",
      },
    },
  },
} satisfies Meta<typeof ScheduleViewControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActiveFilters: Story = {
  args: { activeFilterCount: 2 },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: /^Filter\s*,\s*2 aktiva$/ }),
    ).toBeVisible();
  },
};

export const FavoritesOn: Story = { args: { showFavorites: true } };

export const Rooms: Story = { args: { view: "rooms" } };

export const Interaction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Filter/ }));
    await expect(args.onOpenFilters).toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: "Favoriter" }));
    await expect(args.onShowFavoritesChange).toHaveBeenCalledWith(true);

    await userEvent.click(canvas.getByRole("radio", { name: "Rum" }));
    await expect(args.onViewChange).toHaveBeenCalledWith("rooms");
    await expect(canvas.getByRole("radio", { name: "Rum" })).toBeChecked();
  },
};

export const MobileWithCount: Story = {
  args: { activeFilterCount: 2, showFavorites: true },
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const EnglishMobile: Story = {
  args: { activeFilterCount: 2 },
  globals: { locale: "en", viewport: { value: "mobile", isRotated: false } },
};

export const Dark: Story = {
  args: { activeFilterCount: 1, showFavorites: true },
  globals: { colorMode: "dark" },
};
