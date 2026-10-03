import { GroupInfo } from "@/components/groups/GroupInfo";

export default function GroupInfoPage({ params }: { params: { groupId: string } }) {
  return <GroupInfo groupId={params.groupId} />;
}
