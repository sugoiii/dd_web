import { type ComponentProps, type ElementType } from "react";
import { format, isValid } from "date-fns";
import { CalendarDays } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export type ToolbarSelectOption = {
  value: string;
  label: string;
};

type ToolbarBaseItem = {
  id: string;
};

export type ToolbarDateItem = ToolbarBaseItem & {
  type: "date";
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  buttonClassName?: string;
  icon?: ElementType;
};

export type ToolbarDateRangeItem = ToolbarBaseItem & {
  type: "dateRange";
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  buttonClassName?: string;
  icon?: ElementType;
};

export type ToolbarTextItem = ToolbarBaseItem & {
  type: "text";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
};

export type ToolbarSelectItem = ToolbarBaseItem & {
  type: "select";
  value?: string;
  onChange: (value: string) => void;
  options: ToolbarSelectOption[];
  placeholder?: string;
  size?: "sm" | "default";
  triggerClassName?: string;
};

export type ToolbarActionItem = ToolbarBaseItem & {
  type: "action";
  label: string;
  onClick: () => void;
  icon?: ElementType;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
};

export type ToolbarItem =
  | ToolbarDateItem
  | ToolbarDateRangeItem
  | ToolbarTextItem
  | ToolbarSelectItem
  | ToolbarActionItem;

export type CommonToolbarProps = {
  items: ToolbarItem[];
};

const DEFAULT_DATE_PLACEHOLDER = "Pick a date";
const DEFAULT_RANGE_PLACEHOLDER = "Pick a range";

const getDateLabel = (date: Date | undefined, placeholder: string) =>
  date && isValid(date) ? format(date, "MMM d, yyyy") : placeholder;

const getDateRangeLabel = (range: DateRange | undefined, placeholder: string) => {
  if (!range?.from || !isValid(range.from)) {
    return placeholder;
  }

  const start = format(range.from, "MMM d, yyyy");
  if (!range.to || !isValid(range.to)) {
    return `${start} - ...`;
  }

  return `${start} - ${format(range.to, "MMM d, yyyy")}`;
};

export function CommonToolbar({ items }: CommonToolbarProps) {
  const renderItem = (item: ToolbarItem) => {
    switch (item.type) {
      case "date": {
        const DateIcon = item.icon ?? CalendarDays;
        const displayDate = getDateLabel(item.value, item.placeholder ?? DEFAULT_DATE_PLACEHOLDER);
        const hasDate = item.value && isValid(item.value);

        return (
          <Popover key={item.id}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[164px] justify-start gap-2 text-left font-normal",
                  !hasDate && "text-muted-foreground",
                  item.buttonClassName,
                )}
              >
                <DateIcon className="size-4" aria-hidden />
                <span>{displayDate}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={item.value}
                onSelect={item.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }
      case "dateRange": {
        const DateIcon = item.icon ?? CalendarDays;
        const displayRange = getDateRangeLabel(item.value, item.placeholder ?? DEFAULT_RANGE_PLACEHOLDER);
        const hasRange = item.value?.from && isValid(item.value.from);

        return (
          <Popover key={item.id}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[200px] justify-start gap-2 text-left font-normal",
                  !hasRange && "text-muted-foreground",
                  item.buttonClassName,
                )}
              >
                <DateIcon className="size-4" aria-hidden />
                <span>{displayRange}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={item.value}
                onSelect={item.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }
      case "text":
        return (
          <Input
            key={item.id}
            value={item.value}
            onChange={(event) => item.onChange(event.target.value)}
            placeholder={item.placeholder}
            className={item.inputClassName}
          />
        );
      case "select":
        return (
          <Select key={item.id} value={item.value} onValueChange={item.onChange}>
            <SelectTrigger size={item.size ?? "sm"} className={item.triggerClassName}>
              <SelectValue placeholder={item.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {item.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "action": {
        const ActionIcon = item.icon;
        const isDisabled = item.disabled ?? item.isLoading;

        return (
          <Button
            key={item.id}
            type="button"
            variant={item.variant ?? "secondary"}
            size={item.size ?? "sm"}
            onClick={item.onClick}
            disabled={isDisabled}
            className={item.className}
          >
            {ActionIcon ? (
              <ActionIcon
                className={cn("size-4", item.isLoading && "animate-spin")}
                aria-hidden
              />
            ) : null}
            {item.label}
          </Button>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(renderItem)}
    </div>
  );
}
