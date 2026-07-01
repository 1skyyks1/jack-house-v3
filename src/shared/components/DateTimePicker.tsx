import { CalendarBlank } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateTimePickerProps = {
  "aria-invalid"?: boolean
  className?: string
  disabled?: boolean
  id?: string
  onChange: (value: string) => void
  placeholder?: string
  value?: string | null
}

export function DateTimePicker({
  "aria-invalid": ariaInvalid,
  className,
  disabled = false,
  id,
  onChange,
  placeholder = "Select date and time",
  value,
}: DateTimePickerProps) {
  const selectedDate = parseDateTimeValue(value)
  const timeValue = getTimePart(value)

  const handleDateSelect = (date?: Date) => {
    if (!date) {
      onChange("")
      return
    }

    onChange(toDateTimeLocalValue(date, timeValue))
  }

  const handleTimeChange = (time: string) => {
    const date = selectedDate ?? new Date()
    onChange(toDateTimeLocalValue(date, time))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={ariaInvalid}
          className={cn("w-full justify-start font-normal", !selectedDate && "text-muted-foreground", className)}
          disabled={disabled}
          id={id}
          type="button"
          variant="outline"
        >
          <CalendarBlank className="size-4" />
          <span className="truncate">{selectedDate ? formatDateTimeLabel(selectedDate) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          captionLayout="dropdown"
          endMonth={new Date(new Date().getFullYear() + 10, 11)}
          mode="single"
          selected={selectedDate}
          startMonth={new Date(new Date().getFullYear() - 5, 0)}
          onSelect={handleDateSelect}
        />
        <div className="border-t p-3">
          <Input
            aria-label="Time"
            disabled={disabled}
            type="time"
            value={timeValue}
            onChange={(event) => handleTimeChange(event.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function parseDateTimeValue(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function getTimePart(value?: string | null) {
  const match = value?.match(/T(\d{2}:\d{2})/)
  return match?.[1] ?? "00:00"
}

function toDateTimeLocalValue(date: Date, time: string) {
  const [hours = "00", minutes = "00"] = time.split(":")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hours}:${minutes}`
}

function formatDateTimeLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}
