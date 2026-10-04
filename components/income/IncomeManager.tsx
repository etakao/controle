"use client";

import { Pencil, Plus, RefreshCw, Trash2, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalDatePicker } from "@/components/ui/BrutalDatePicker";
import { BrutalInput } from "@/components/ui/BrutalInput";
import { BrutalModal } from "@/components/ui/BrutalModal";
import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeriodFilter, PeriodState } from "@/components/ui/PeriodFilter";
import { formatDateOnly, toLocalISODate } from "@/lib/dates";
import { requestWithToast } from "@/lib/request";
import { formatCurrency } from "@/lib/utils";

type Member = { user: { id: string; name: string; email: string } };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE"; color?: string };
type Income = {
  id: string;
  amount: string;
  date: string;
  description?: string;
  category?: Category | null;
  responsible: { id: string; name: string };
  isRecurring: boolean;
  recurringRef?: string | null;
  recurringNum?: number | null;
  recurringTotal?: number | null;
};

type GroupPayload = { group: { members: Member[]; categories: Category[] } };
type IncomePayload = { incomes: Income[]; total: number };

const frequencyLabels: Record<string, string> = {
  MONTHLY: "Mensal",
  ANNUAL: "Anual",
  CUSTOM: "Personalizado"
};

const emptyForm = () => ({
  date: toLocalISODate(new Date()),
  amount: "",
  categoryId: "",
  responsibleId: "",
  description: "",
  isRecurring: false,
  recurringFrequency: "MONTHLY",
  recurringInterval: 2,
  recurringTotal: 12
});

export function IncomeManager({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<GroupPayload["group"] | null>(null);
  const [data, setData] = useState<IncomePayload>({ incomes: [], total: 0 });
  const [period, setPeriod] = useState<PeriodState>({ period: "month" });
  const [form, setForm] = useState(emptyForm());
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", categoryId: "", responsibleId: "", description: "", date: "" });
  const [deleteModal, setDeleteModal] = useState<{ income: Income } | null>(null);
  const [editModeModal, setEditModeModal] = useState<{ income: Income } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ period: period.period });
    if (period.period === "custom") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }
    return params.toString();
  }, [period]);

  async function load() {
    const [groupResponse, incomeResponse] = await Promise.all([
      fetch(`/api/groups/${groupId}`),
      fetch(`/api/groups/${groupId}/income?${query}`)
    ]);
    const groupJson = (await groupResponse.json()) as GroupPayload;
    const incomeJson = (await incomeResponse.json()) as IncomePayload;
    setGroup(groupJson.group);
    setData(incomeJson);
    if (!form.responsibleId && groupJson.group?.members[0]) {
      setForm((current) => ({ ...current, responsibleId: groupJson.group.members[0].user.id }));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, query]);

  async function createIncome(event: React.FormEvent) {
    event.preventDefault();
    const created = await requestWithToast(`/api/groups/${groupId}/income`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
        isRecurring: form.isRecurring,
        recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
        recurringInterval: form.isRecurring && form.recurringFrequency === "CUSTOM" ? form.recurringInterval : null,
        recurringTotal: form.isRecurring ? form.recurringTotal : null
      })
    }, { success: "Receita criada.", error: "Não foi possível criar a receita." });
    if (!created) return;
    setForm(emptyForm());
    setIsFormOpen(false);
    await load();
  }

  function startEdit(income: Income) {
    setEditingIncome(income);
    setEditForm({
      amount: String(income.amount),
      categoryId: income.category?.id ?? "",
      responsibleId: income.responsible.id,
      description: income.description ?? "",
      date: income.date.slice(0, 10)
    });
  }

  async function submitEdit(mode = "single") {
    if (!editingIncome) return;
    const updated = await requestWithToast(`/api/groups/${groupId}/income/${editingIncome.id}?mode=${mode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(editForm.amount),
        categoryId: editForm.categoryId || null,
        responsibleId: editForm.responsibleId,
        description: editForm.description || null,
        date: mode === "single" ? editForm.date : undefined
      })
    }, { success: "Receita atualizada.", error: "Não foi possível atualizar a receita." });
    if (!updated) return;
    setEditingIncome(null);
    setEditModeModal(null);
    await load();
  }

  function requestEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingIncome) return;
    if (isSeriesIncome(editingIncome)) {
      setEditModeModal({ income: editingIncome });
    } else {
      submitEdit("single");
    }
  }

  async function removeIncome(income: Income, mode = "single") {
    const removed = await requestWithToast(
      `/api/groups/${groupId}/income/${income.id}?mode=${mode}`,
      { method: "DELETE" },
      { success: "Receita removida.", error: "Não foi possível remover a receita." }
    );
    if (!removed) return;
    setDeleteModal(null);
    await load();
  }

  function isSeriesIncome(income: Income) {
    return Boolean(income.isRecurring && income.recurringRef);
  }

  const incomeCategories = group?.categories.filter((c) => c.type === "INCOME") ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <BrutalBadge color="#B8F0D4">Receitas</BrutalBadge>
          <h1 className="mt-2 font-display text-3xl font-black">Entradas do período</h1>
          <p className="money mt-1 text-xl font-black">{formatCurrency(data.total)}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <PeriodFilter value={period} onChange={setPeriod} />
          <BrutalButton className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
            <Plus size={16} />
            Nova receita
          </BrutalButton>
        </div>
      </div>

      <BrutalModal className="max-w-3xl" open={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nova receita">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={createIncome}>
          <label className="grid gap-1 text-xs font-black uppercase md:col-span-3">
            Descrição
            <BrutalInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Data
            <BrutalDatePicker required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Valor
            <CurrencyInput required value={form.amount} onValueChange={(amount) => setForm({ ...form, amount })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Categoria
            <BrutalSelect value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Sem categoria</option>
              {incomeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Responsável
            <BrutalSelect required value={form.responsibleId} onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}>
              {group?.members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </BrutalSelect>
          </label>
          <label className="flex items-center gap-2 text-xs font-black uppercase self-end pb-1">
            <BrutalInput
              checked={form.isRecurring}
              className="h-5 min-h-0 w-5"
              type="checkbox"
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            />
            Receita fixa
          </label>
          {form.isRecurring ? (
            <div className="flex flex-wrap gap-3 md:col-span-3">
              <label className="grid gap-1 text-xs font-black uppercase">
                Frequência
                <BrutalSelect value={form.recurringFrequency} onChange={(e) => setForm({ ...form, recurringFrequency: e.target.value })}>
                  {Object.entries(frequencyLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </BrutalSelect>
              </label>
              {form.recurringFrequency === "CUSTOM" ? (
                <label className="grid gap-1 text-xs font-black uppercase">
                  Intervalo (meses)
                  <BrutalInput
                    min={1} max={24} type="number"
                    value={form.recurringInterval}
                    onChange={(e) => setForm({ ...form, recurringInterval: Number(e.target.value) })}
                  />
                </label>
              ) : null}
              <label className="grid gap-1 text-xs font-black uppercase">
                Ocorrências
                <BrutalInput
                  min={2} max={120} type="number"
                  value={form.recurringTotal}
                  onChange={(e) => setForm({ ...form, recurringTotal: Number(e.target.value) })}
                />
              </label>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 md:col-span-3">
            <BrutalButton type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </BrutalButton>
            <BrutalButton type="submit">
              <Plus size={16} />
              Adicionar
            </BrutalButton>
          </div>
        </form>
      </BrutalModal>

      {data.incomes.length === 0 ? <EmptyState title="Nenhuma receita no período" /> : (
        <div className="grid gap-3">
          {data.incomes.map((income) => (
            <BrutalCard key={income.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <BrutalBadge color={income.category?.color ?? "#B8F0D4"}>{income.category?.name ?? "Sem categoria"}</BrutalBadge>
                  <BrutalBadge color="#C2E4FF">{income.responsible.name}</BrutalBadge>
                  {income.isRecurring ? (
                    <BrutalBadge color="#D4C5F9">
                      <RefreshCw size={10} className="inline mr-1" />
                      Fixa {income.recurringNum}/{income.recurringTotal}
                    </BrutalBadge>
                  ) : null}
                </div>
                <p className="mt-2 font-black">{income.description || "Receita"}</p>
                <p className="text-sm font-bold">{formatDateOnly(income.date)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <strong className="money text-xl font-black">{formatCurrency(income.amount)}</strong>
                <BrutalButton aria-label="Editar" className="h-9 w-9 px-0" variant="ghost" onClick={() => startEdit(income)}>
                  <Pencil size={16} />
                </BrutalButton>
                <BrutalButton aria-label="Remover" className="h-9 w-9 px-0" variant="danger" onClick={() => setDeleteModal({ income })}>
                  <Trash2 size={16} />
                </BrutalButton>
              </div>
            </BrutalCard>
          ))}
        </div>
      )}

      <BrutalModal className="max-w-3xl" open={Boolean(editingIncome) && !editModeModal} onClose={() => setEditingIncome(null)} title="Editar receita">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={requestEditSubmit}>
          <label className="grid gap-1 text-xs font-black uppercase md:col-span-2">
            Descrição
            <BrutalInput value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Data
            <BrutalDatePicker required value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Valor
            <CurrencyInput required value={editForm.amount} onValueChange={(amount) => setEditForm({ ...editForm, amount })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Categoria
            <BrutalSelect value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}>
              <option value="">Sem categoria</option>
              {incomeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Responsável
            <BrutalSelect required value={editForm.responsibleId} onChange={(e) => setEditForm({ ...editForm, responsibleId: e.target.value })}>
              {group?.members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </BrutalSelect>
          </label>
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            <BrutalButton type="button" variant="ghost" onClick={() => setEditingIncome(null)}>
              Cancelar
            </BrutalButton>
            <BrutalButton type="submit" variant="secondary">
              <Check size={16} />
              Salvar
            </BrutalButton>
          </div>
        </form>
      </BrutalModal>

      <BrutalModal open={Boolean(deleteModal)} onClose={() => setDeleteModal(null)} title="Remover receita">
        {deleteModal && isSeriesIncome(deleteModal.income) ? (
          <>
            <p className="font-bold">Esta é uma receita fixa. O que deseja remover?</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BrutalButton variant="danger" onClick={() => removeIncome(deleteModal.income, "single")}>Apenas esta</BrutalButton>
              <BrutalButton variant="danger" onClick={() => removeIncome(deleteModal.income, "remaining")}>Esta e as próximas</BrutalButton>
              <BrutalButton variant="danger" onClick={() => removeIncome(deleteModal.income, "all")}>Todas as ocorrências</BrutalButton>
              <BrutalButton variant="ghost" onClick={() => setDeleteModal(null)}>Cancelar</BrutalButton>
            </div>
          </>
        ) : (
          <>
            <p className="font-bold">
              Tem certeza que deseja remover a receita &quot;{deleteModal?.income.description || "Receita"}&quot; de{" "}
              <span className="money">{formatCurrency(deleteModal?.income.amount ?? 0)}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <BrutalButton variant="ghost" onClick={() => setDeleteModal(null)}>Cancelar</BrutalButton>
              <BrutalButton variant="danger" onClick={() => deleteModal && removeIncome(deleteModal.income)}>
                <Trash2 size={16} />
                Remover
              </BrutalButton>
            </div>
          </>
        )}
      </BrutalModal>

      <BrutalModal open={Boolean(editModeModal)} onClose={() => setEditModeModal(null)} title="Editar receita fixa">
        <p className="font-bold">Esta é uma receita fixa. O que deseja editar?</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BrutalButton variant="secondary" onClick={() => submitEdit("single")}>Apenas esta</BrutalButton>
          <BrutalButton variant="secondary" onClick={() => submitEdit("from_now")}>Esta e as próximas</BrutalButton>
          <BrutalButton variant="secondary" onClick={() => submitEdit("all")}>Todas as ocorrências</BrutalButton>
          <BrutalButton variant="ghost" onClick={() => setEditModeModal(null)}>Voltar</BrutalButton>
        </div>
      </BrutalModal>
    </div>
  );
}
