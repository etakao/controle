"use client";

import { Check, Copy, Crown, Link2, Pencil, RefreshCw, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalInput, BrutalTextarea } from "@/components/ui/BrutalInput";
import { BrutalModal } from "@/components/ui/BrutalModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { notifyGroupsChanged } from "@/lib/groupEvents";
import { formatDate } from "@/lib/utils";

type Member = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  user: { id: string; name: string; email: string };
};

const roleConfig = {
  OWNER: { label: "Dono", icon: Crown, color: "#FFF0A0" },
  ADMIN: { label: "Admin", icon: Shield, color: "#D4C5F9" },
  MEMBER: { label: "Membro", icon: User, color: "#C2E4FF" }
};

export function GroupInfo({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [timedLink, setTimedLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState<Member["role"] | null>(null);
  const [group, setGroup] = useState<{ name: string; description?: string | null } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [membersRes, groupRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/members`),
      fetch(`/api/groups/${groupId}`)
    ]);
    const membersJson = await membersRes.json();
    const groupJson = await groupRes.json();
    setMembers(membersJson.members ?? []);
    setRole(groupJson.role ?? null);
    setGroup(groupJson.group ? { name: groupJson.group.name, description: groupJson.group.description } : null);

    // Mostra o link temporário ainda válido (tokens só vêm para o dono).
    const { timedInviteToken, timedInviteExpiresAt } = groupJson.group ?? {};
    if (timedInviteToken && timedInviteExpiresAt && new Date(timedInviteExpiresAt) > new Date()) {
      setTimedLink({ url: `${window.location.origin}/invite/${timedInviteToken}`, expiresAt: timedInviteExpiresAt });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function generateTimedLink() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite-link`, { method: "POST" });
      const data = await res.json();
      setTimedLink({ url: `${window.location.origin}/invite/${data.token}`, expiresAt: data.expiresAt });
    } finally {
      setGenerating(false);
    }
  }

  function openEdit() {
    setEditForm({ name: group?.name ?? "", description: group?.description ?? "" });
    setEditError("");
    setIsEditOpen(true);
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, description: editForm.description || null })
      });
      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error ?? "Não foi possível salvar o grupo.");
        return;
      }

      setGroup({ name: data.group.name, description: data.group.description });
      setIsEditOpen(false);
      notifyGroupsChanged();
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <BrutalBadge color="#C2E4FF">Informações</BrutalBadge>
          <h1 className="mt-2 break-words font-display text-3xl font-black">{group?.name ?? "Grupo"}</h1>
          {group?.description ? <p className="mt-1 break-words font-bold text-ink/70">{group.description}</p> : null}
        </div>
        {role === "OWNER" ? (
          <BrutalButton className="w-full shrink-0 sm:w-auto" variant="secondary" onClick={openEdit}>
            <Pencil size={16} />
            Editar grupo
          </BrutalButton>
        ) : null}
      </div>

      <section className="grid grid-cols-1 gap-3">
        <h2 className="font-display text-2xl font-black">Integrantes</h2>
        {members.length === 0 ? (
          <EmptyState title="Nenhum membro" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {members.map((member) => {
              const config = roleConfig[member.role];
              const Icon = config.icon;
              return (
                <BrutalCard key={member.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-brutal border-2 border-ink shadow-brutal" style={{ backgroundColor: config.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{member.user.name}</p>
                    <p className="truncate text-xs font-bold text-ink/60">{member.user.email}</p>
                  </div>
                  <BrutalBadge color={config.color}>{config.label}</BrutalBadge>
                </BrutalCard>
              );
            })}
          </div>
        )}
      </section>

      {role === "OWNER" ? (
        <section className="grid grid-cols-1 gap-3">
          <h2 className="font-display text-2xl font-black">Link de convite</h2>

          <BrutalCard className="min-w-0 p-4" tone="lavender">
            <p className="text-xs font-black uppercase">Link temporário (30 minutos)</p>
            <p className="mt-1 text-sm font-bold text-ink/60">Gere um link com expiração automática de 30 minutos.</p>
            {timedLink ? (
              <div className="mt-3 grid grid-cols-1 gap-2">
                <div className="flex min-w-0 gap-2">
                  <code className="min-w-0 flex-1 overflow-hidden truncate rounded-brutal border-2 border-ink bg-white px-3 py-2 text-xs font-bold">
                    {timedLink.url}
                  </code>
                  <BrutalButton className="h-10 w-10 shrink-0 px-0" variant="ghost" onClick={() => copyToClipboard(timedLink.url)}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </BrutalButton>
                </div>
                <p className="text-xs font-bold">
                  <Link2 size={12} className="inline mr-1" />
                  Expira em: {formatDate(timedLink.expiresAt)} às {new Date(timedLink.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : null}
            <div className="mt-3">
              <BrutalButton disabled={generating} onClick={generateTimedLink}>
                <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
                {timedLink ? "Gerar novo link" : "Gerar link temporário"}
              </BrutalButton>
            </div>
          </BrutalCard>
        </section>
      ) : role ? (
        <p className="text-sm font-bold text-ink/60">Apenas o dono do grupo pode convidar novas pessoas.</p>
      ) : null}

      <BrutalModal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar grupo">
        <form className="grid gap-4" onSubmit={submitEdit}>
          <label className="grid gap-1 text-xs font-black uppercase">
            Nome
            <BrutalInput
              autoFocus
              maxLength={80}
              minLength={2}
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Descrição
            <BrutalTextarea
              maxLength={240}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </label>
          {editError ? <p className="text-sm font-bold text-red-700">{editError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <BrutalButton type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </BrutalButton>
            <BrutalButton disabled={saving} type="submit" variant="secondary">
              <Check size={16} />
              {saving ? "Salvando..." : "Salvar"}
            </BrutalButton>
          </div>
        </form>
      </BrutalModal>
    </div>
  );
}
