import { SplitsManager } from "@/components/splits/SplitsManager";

export default function SplitsPage({ params }: { params: { groupId: string } }) {
  return <SplitsManager groupId={params.groupId} />;
}
