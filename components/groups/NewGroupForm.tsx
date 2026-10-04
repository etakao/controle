"use client";

import { ArrowRight, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalInput, BrutalTextarea } from "@/components/ui/BrutalInput";
import { notifyGroupsChanged } from "@/lib/groupEvents";
import { requestWithToast } from "@/lib/request";

type CreatedGroup = {
  id: string;
  name: string;
};

export function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState<CreatedGroup | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await requestWithToast<{ group: CreatedGroup }>(
        "/api/groups",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description: description || null })
        },
        { success: "Grupo criado.", error: "Não foi possível criar o grupo." }
      );
      if (!data) return;

      setCreated(data.group);
      notifyGroupsChanged();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-4 py-6">
      <section className="border-b-2 border-ink pb-6">
        <BrutalBadge color="#B8F0D4">Grupos</BrutalBadge>
        <h1 className="mt-3 font-display text-4xl font-black">Novo grupo</h1>
        <p className="mt-1 text-sm font-bold text-ink/60">
          Crie um grupo pessoal ou compartilhado para registrar receitas, despesas e divisões.
        </p>
      </section>

      {created ? (
        <BrutalCard className="grid min-w-0 max-w-2xl gap-4 p-5">
          <div>
            <p className="text-xs font-black uppercase">Grupo criado</p>
            <h2 className="mt-1 font-display text-2xl font-black">{created.name}</h2>
          </div>
          <p className="text-sm font-bold text-ink/60">
            Para convidar pessoas, gere um link temporário na aba Informações do grupo.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <BrutalButton variant="ghost" onClick={() => router.push(`/groups/${created.id}/info`)}>
              <UserPlus size={16} />
              Convidar pessoas
            </BrutalButton>
            <BrutalButton onClick={() => router.push(`/groups/${created.id}`)}>
              Acessar grupo
              <ArrowRight size={16} />
            </BrutalButton>
          </div>
        </BrutalCard>
      ) : (
        <BrutalCard className="min-w-0 max-w-2xl p-5">
          <form className="grid gap-4" onSubmit={submit}>
            <label className="grid gap-1 text-xs font-black uppercase">
              Nome
              <BrutalInput autoFocus maxLength={80} minLength={2} required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase">
              Descrição
              <BrutalTextarea maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <div className="flex justify-end">
              <BrutalButton disabled={loading} type="submit">
                <Plus size={16} />
                {loading ? "Criando..." : "Criar grupo"}
              </BrutalButton>
            </div>
          </form>
        </BrutalCard>
      )}
    </div>
  );
}
