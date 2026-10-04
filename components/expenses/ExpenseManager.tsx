"use client";

import { Pencil, Plus, RefreshCw, Trash2, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InstallmentSelector } from "@/components/expenses/InstallmentSelector";
import { SplitDivider, SplitEntry } from "@/components/splits/SplitDivider";
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
type Expense = {
  id: string;
  amount: string;
  date: string;
  description?: string;
  paymentMethod: string;
  installments: number;
  installmentNum?: number;
  isRecurring: boolean;
  recurringRef?: string | null;
  recurringNum?: number | null;
  recurringTotal?: number | null;
  category?: Category | null;
  responsible: { id: string; name: string };
};
type GroupPayload = { group: { members: Member[]; categories: Category[] } };
type ExpensePayload = { expenses: Expense[]; total: number };

const paymentLabels = {
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  PIX: "Pix",
  CASH: "Dinheiro"
};

const frequencyLabels: Record<string, string> = {
  MONTHLY: "Mensal",
  ANNUAL: "Anual",
  CUSTOM: "Personalizado"
};

const emptyForm = () => ({
  date: toLocalISODate(new Date()),
  amount: "",
  paymentMethod: "PIX",
  categoryId: "",
  responsibleId: "",
  description: "",
  isInstallment: false,
  installments: 2,
  isRecurring: false,
  recurringFrequency: "MONTHLY",
  recurringInterval: 2,
  recurringTotal: 12
});

export function ExpenseManager({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<GroupPayload["group"] | null>(null);
  const [data, setData] = useState<ExpensePayload>({ expenses: [], total: 0 });
  const [period, setPeriod] = useState<PeriodState>({ period: "month" });
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitUsers, setSplitUsers] = useState<SplitEntry[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", categoryId: "", responsibleId: "", description: "", date: "", paymentMethod: "PIX" });
  const [deleteModal, setDeleteModal] = useState<{ expense: Expense } | null>(null);
  const [editModeModal, setEditModeModal] = useState<{ expense: Expense } | null>(null);
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
    const [groupResponse, expenseResponse] = await Promise.all([
      fetch(`/api/groups/${groupId}`),
      fetch(`/api/groups/${groupId}/expenses?${query}`)
    ]);
    const groupJson = (await groupResponse.json()) as GroupPayload;
    const expenseJson = (await expenseResponse.json()) as ExpensePayload;
    setGroup(groupJson.group);
    setData(expenseJson);
    if (!form.responsibleId && groupJson.group?.members[0]) {
      setForm((current) => ({ ...current, responsibleId: groupJson.group.members[0].user.id }));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, query]);

  function toggleSplit(enabled: boolean) {
    setSplitEnabled(enabled);
    // Default: every member selected, no custom amount (equal share)
    setSplitUsers(enabled && group ? group.members.map((m) => ({ userId: m.user.id })) : []);
  }

  async function createExpense(event: React.FormEvent) {
    event.preventDefault();
    const created = await requestWithToast(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
        installments: isInstallmentActive ? Number(form.installments) : 1,
        splits: splitEnabled ? splitUsers.map((e) => ({ userId: e.userId, amount: e.amount })) : [],
        isRecurring: form.isRecurring,
        recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
        recurringInterval: form.isRecurring && form.recurringFrequency === "CUSTOM" ? form.recurringInterval : null,
        recurringTotal: form.isRecurring ? form.recurringTotal : null
      })
    }, { success: "Despesa criada.", error: "Não foi possível criar a despesa." });
    if (!created) return;
    setForm(emptyForm());
    setSplitUsers([]);
    setSplitEnabled(false);
    setIsFormOpen(false);
    await load();
  }

  function startEdit(expense: Expense) {
    setEditingExpense(expense);
    setEditForm({
      amount: String(expense.amount),
      categoryId: expense.category?.id ?? "",
      responsibleId: expense.responsible.id,
      description: expense.description ?? "",
      date: expense.date.slice(0, 10),
      paymentMethod: expense.paymentMethod
    });
  }

  async function submitEdit(mode = "single") {
    if (!editingExpense) return;
    const updated = await requestWithToast(`/api/groups/${groupId}/expenses/${editingExpense.id}?mode=${mode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(editForm.amount),
        categoryId: editForm.categoryId || null,
        responsibleId: editForm.responsibleId,
        description: editForm.description || null,
        date: mode === "single" ? editForm.date : undefined,
        paymentMethod: editForm.paymentMethod
      })
    }, { success: "Despesa atualizada.", error: "Não foi possível atualizar a despesa." });
    if (!updated) return;
    setEditingExpense(null);
    setEditModeModal(null);
    await load();
  }

  function requestEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingExpense) return;
    if (editingExpense.isRecurring) {
      setEditModeModal({ expense: editingExpense });
    } else {
      submitEdit("single");
    }
  }

  async function removeExpense(expense: Expense, mode = "single") {
    const removed = await requestWithToast(
      `/api/groups/${groupId}/expenses/${expense.id}?mode=${mode}`,
      { method: "DELETE" },
      { success: "Despesa removida.", error: "Não foi possível remover a despesa." }
    );
    if (!removed) return;
    setDeleteModal(null);
    await load();
  }

  function isSeriesExpense(expense: Expense) {
    return (expense.installments > 1 && expense.installmentNum !== undefined) || Boolean(expense.isRecurring && expense.recurringRef);
  }

  // Parcelamento só se aplica a cartão de crédito e não combina com despesa fixa.
  const canInstall = form.paymentMethod === "CREDIT_CARD";
  const isInstallmentActive = canInstall && form.isInstallment && !form.isRecurring;

  const expenseCategories = group?.categories.filter((c) => c.type === "EXPENSE") ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <BrutalBadge color="#FFD6C0">Despesas</BrutalBadge>
          <h1 className="mt-2 font-display text-3xl font-black">Saídas do período</h1>
          <p className="money mt-1 text-xl font-black">{formatCurrency(data.total)}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <PeriodFilter value={period} onChange={setPeriod} />
          <BrutalButton className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
            <Plus size={16} />
            Nova despesa
          </BrutalButton>
        </div>
      </div>

      <BrutalModal className="max-w-3xl" open={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nova despesa">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={createExpense}>
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
            Pagamento
            <BrutalSelect value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {Object.entries(paymentLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Categoria
            <BrutalSelect value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Sem categoria</option>
              {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Responsável
            <BrutalSelect required value={form.responsibleId} onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}>
              {group?.members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </BrutalSelect>
          </label>
          <label className="flex items-center gap-2 text-xs font-black uppercase">
            <BrutalInput className="h-5 min-h-0 w-5" type="checkbox" checked={splitEnabled} onChange={(e) => toggleSplit(e.target.checked)} />
            Dividir despesa
          </label>
          <label className="flex items-center gap-2 text-xs font-black uppercase">
            <BrutalInput
              checked={form.isRecurring}
              className="h-5 min-h-0 w-5"
              type="checkbox"
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked, isInstallment: e.target.checked ? false : form.isInstallment })}
            />
            Despesa fixa
          </label>
          {canInstall ? (
            <label className="flex items-center gap-2 text-xs font-black uppercase">
              <BrutalInput
                checked={isInstallmentActive}
                className="h-5 min-h-0 w-5"
                type="checkbox"
                onChange={(e) => setForm({ ...form, isInstallment: e.target.checked, isRecurring: e.target.checked ? false : form.isRecurring })}
              />
              Parcelado
            </label>
          ) : null}
          {isInstallmentActive ? (
            <InstallmentSelector value={form.installments} onChange={(installments) => setForm({ ...form, installments })} />
          ) : null}
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
          {splitEnabled && group ? (
            <div className="md:col-span-3">
              <SplitDivider amount={Number(form.amount || 0)} members={group.members} selected={splitUsers} onChange={setSplitUsers} />
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

      {data.expenses.length === 0 ? <EmptyState title="Nenhuma despesa no período" /> : (
        <div className="grid gap-3">
          {data.expenses.map((expense) => (
            <BrutalCard key={expense.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <BrutalBadge color={expense.category?.color ?? "#FFD6C0"}>{expense.category?.name ?? "Sem categoria"}</BrutalBadge>
                  <BrutalBadge color="#C2E4FF">{paymentLabels[expense.paymentMethod as keyof typeof paymentLabels]}</BrutalBadge>
                  {expense.installments > 1 ? <BrutalBadge color="#FFF0A0">{expense.installmentNum}/{expense.installments}</BrutalBadge> : null}
                  {expense.isRecurring ? (
                    <BrutalBadge color="#D4C5F9">
                      <RefreshCw size={10} className="inline mr-1" />
                      Fixa {expense.recurringNum}/{expense.recurringTotal}
                    </BrutalBadge>
                  ) : null}
                </div>
                <p className="mt-2 font-black">{expense.description || "Despesa"}</p>
                <p className="text-sm font-bold">{formatDateOnly(expense.date)} · {expense.responsible.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <strong className="money text-xl font-black">{formatCurrency(expense.amount)}</strong>
                <BrutalButton aria-label="Editar" className="h-9 w-9 px-0" variant="ghost" onClick={() => startEdit(expense)}>
                  <Pencil size={16} />
                </BrutalButton>
                <BrutalButton aria-label="Remover" className="h-9 w-9 px-0" variant="danger" onClick={() => setDeleteModal({ expense })}>
                  <Trash2 size={16} />
                </BrutalButton>
              </div>
            </BrutalCard>
          ))}
        </div>
      )}

      <BrutalModal className="max-w-3xl" open={Boolean(editingExpense) && !editModeModal} onClose={() => setEditingExpense(null)} title="Editar despesa">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={requestEditSubmit}>
          <label className="grid gap-1 text-xs font-black uppercase md:col-span-3">
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
            Pagamento
            <BrutalSelect value={editForm.paymentMethod} onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}>
              {Object.entries(paymentLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Categoria
            <BrutalSelect value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}>
              <option value="">Sem categoria</option>
              {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Responsável
            <BrutalSelect required value={editForm.responsibleId} onChange={(e) => setEditForm({ ...editForm, responsibleId: e.target.value })}>
              {group?.members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </BrutalSelect>
          </label>
          <div className="flex flex-wrap justify-end gap-2 md:col-span-3">
            <BrutalButton type="button" variant="ghost" onClick={() => setEditingExpense(null)}>
              Cancelar
            </BrutalButton>
            <BrutalButton type="submit" variant="secondary">
              <Check size={16} />
              Salvar
            </BrutalButton>
          </div>
        </form>
      </BrutalModal>

      <BrutalModal open={Boolean(deleteModal)} onClose={() => setDeleteModal(null)} title="Remover despesa">
        {deleteModal && isSeriesExpense(deleteModal.expense) ? (
          <>
            <p className="font-bold">
              {deleteModal.expense.isRecurring ? "Esta é uma despesa fixa." : "Esta é uma despesa parcelada."} O que deseja remover?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BrutalButton variant="danger" onClick={() => removeExpense(deleteModal.expense, "single")}>Apenas esta</BrutalButton>
              <BrutalButton variant="danger" onClick={() => removeExpense(deleteModal.expense, "remaining")}>Esta e as próximas</BrutalButton>
              {deleteModal.expense.isRecurring ? (
                <BrutalButton variant="danger" onClick={() => removeExpense(deleteModal.expense, "all")}>Todas as ocorrências</BrutalButton>
              ) : null}
              <BrutalButton variant="ghost" onClick={() => setDeleteModal(null)}>Cancelar</BrutalButton>
            </div>
          </>
        ) : (
          <>
            <p className="font-bold">
              Tem certeza que deseja remover a despesa &quot;{deleteModal?.expense.description || "Despesa"}&quot; de{" "}
              <span className="money">{formatCurrency(deleteModal?.expense.amount ?? 0)}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <BrutalButton variant="ghost" onClick={() => setDeleteModal(null)}>Cancelar</BrutalButton>
              <BrutalButton variant="danger" onClick={() => deleteModal && removeExpense(deleteModal.expense)}>
                <Trash2 size={16} />
                Remover
              </BrutalButton>
            </div>
          </>
        )}
      </BrutalModal>

      <BrutalModal open={Boolean(editModeModal)} onClose={() => setEditModeModal(null)} title="Editar despesa fixa">
        <p className="font-bold">Esta é uma despesa fixa. O que deseja editar?</p>
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
