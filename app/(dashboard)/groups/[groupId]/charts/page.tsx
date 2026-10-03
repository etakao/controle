import { ChartsPanel } from "@/components/charts/ChartsPanel";

export default function ChartsPage({ params }: { params: { groupId: string } }) {
  return <ChartsPanel groupId={params.groupId} />;
}
