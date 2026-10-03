import { IncomeManager } from "@/components/income/IncomeManager";

export default function IncomePage({ params }: { params: { groupId: string } }) {
  return <IncomeManager groupId={params.groupId} />;
}
