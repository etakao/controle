import { ExpenseManager } from "@/components/expenses/ExpenseManager";

export default function ExpensesPage({ params }: { params: { groupId: string } }) {
  return <ExpenseManager groupId={params.groupId} />;
}
