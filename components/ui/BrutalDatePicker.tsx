import { BrutalInput } from "@/components/ui/BrutalInput";

type BrutalDatePickerProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function BrutalDatePicker(props: BrutalDatePickerProps) {
  return <BrutalInput type="date" {...props} />;
}
