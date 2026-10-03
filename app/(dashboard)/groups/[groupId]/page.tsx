import { GroupSummary } from "@/components/groups/GroupSummary";

export default function GroupPage({ params }: { params: { groupId: string } }) {
  return <GroupSummary groupId={params.groupId} />;
}
