import { InviteFlow } from "@/components/invite/InviteFlow";

export default function InvitePage({ params }: { params: { token: string } }) {
  return <InviteFlow token={params.token} />;
}
