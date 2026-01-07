import { format, isValid } from "date-fns";
import { CalendarDays, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

const VIEW_OPTIONS = [
  { value: "overview", label: "Overview" },
  { value: "stress", label: "Stress" },
];

const SCOPE_OPTIONS = [
  { value: "core", label: "Core sleeves" },
  { value: "extended", label: "Extended" },
];

export type CommonToolbarProps = {
  selectedDate?: Date;
  view: string;
  scope: string;
  isRefreshing?: boolean;
  onDateChange: (date?: Date) => void;
  onViewChange: (value: string) => void;
  onScopeChange: (value: string) => void;
  onRefresh: () => void;
};

export function CommonToolbar({
  selectedDate,
  view,
  scope,
  isRefreshing = false,
  onDateChange,
  onViewChange,
  onScopeChange,
  onRefresh,
}: CommonToolbarProps) {
  const displayDate = selectedDate && isValid(selectedDate)
    ? format(selectedDate, "MMM d, yyyy")
    : "Pick a date";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[164px] justify-start gap-2 text-left font-normal",
              !selectedDate && "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4" aria-hidden />
            <span>{displayDate}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select value={view} onValueChange={onViewChange}>
        <SelectTrigger size="sm" className="min-w-[150px]">
          <SelectValue placeholder="View" />
        </SelectTrigger>
        <SelectContent>
          {VIEW_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={scope} onValueChange={onScopeChange}>
        <SelectTrigger size="sm" className="min-w-[160px]">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          {SCOPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} aria-hidden />
        Refresh
      </Button>
    </div>
  );
}
