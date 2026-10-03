"use client";

import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalInput } from "@/components/ui/BrutalInput";
import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { pastelPalette } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string;
  isDefault: boolean;
};

export function CategoriesManager({ groupId }: { groupId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", type: "EXPENSE", color: pastelPalette[0] });
  const [editing, setEditing] = useState<{ id: string; name: string; color: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function load() {
    const response = await fetch(`/api/groups/${groupId}/categories`);
    const data = await response.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    await fetch(`/api/groups/${groupId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ ...form, name: "" });
    setIsFormOpen(false);
    await load();
  }

  async function removeCategory(categoryId: string) {
    await fetch(`/api/groups/${groupId}/categories?id=${categoryId}`, { method: "DELETE" });
    await load();
  }

  async function saveEdit(categoryId: string) {
    if (!editing) return;
    await fetch(`/api/groups/${groupId}/categories`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryId, name: editing.name, color: editing.color })
    });
    setEditing(null);
    await load();
  }

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  function renderList(items: Category[]) {
    if (items.length === 0) {
      return <EmptyState title="Nenhuma categoria" />;
    }

    return (
      <div className="grid gap-3">
        {items.map((category) => {
          const isEditing = editing?.id === category.id;
          return (
            <BrutalCard key={category.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex flex-1 items-center gap-3 min-w-0">
                {isEditing ? (
                  <BrutalSelect
                    className="h-8 w-10 p-0"
                    value={editing.color}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  >
                    {pastelPalette.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: c }}>{c}</option>
                    ))}
                  </BrutalSelect>
                ) : (
                  <span
                    className="h-8 w-8 shrink-0 rounded-badge border-2 border-ink shadow-brutal"
                    style={{ backgroundColor: category.color ?? "#D4C5F9" }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <BrutalInput
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  ) : (
                    <>
                      <p className="font-black">{category.name}</p>
                      {category.isDefault ? <p className="text-xs font-bold uppercase">Padrão</p> : null}
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {isEditing ? (
                  <>
                    <BrutalButton aria-label="Salvar" className="h-9 w-9 px-0" variant="secondary" onClick={() => saveEdit(category.id)}>
                      <Check size={16} />
                    </BrutalButton>
                    <BrutalButton aria-label="Cancelar" className="h-9 w-9 px-0" variant="ghost" onClick={() => setEditing(null)}>
                      <X size={16} />
                    </BrutalButton>
                  </>
                ) : (
                  <>
                    <BrutalButton
                      aria-label="Editar categoria"
                      className="h-9 w-9 px-0"
                      variant="ghost"
                      onClick={() => setEditing({ id: category.id, name: category.name, color: category.color ?? pastelPalette[0] })}
                    >
                      <Pencil size={16} />
                    </BrutalButton>
                    <BrutalButton aria-label="Remover categoria" className="h-9 w-9 px-0" variant="danger" onClick={() => removeCategory(category.id)}>
                      <Trash2 size={16} />
                    </BrutalButton>
                  </>
                )}
              </div>
            </BrutalCard>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
        <BrutalBadge color="#D4C5F9">Categorias</BrutalBadge>
        <h1 className="mt-2 font-display text-3xl font-black">Organização visual</h1>
        </div>
        <BrutalButton aria-expanded={isFormOpen} className="w-full sm:w-auto" variant={isFormOpen ? "ghost" : "primary"} onClick={() => setIsFormOpen((current) => !current)}>
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? "Fechar formulario" : "Nova categoria"}
        </BrutalButton>
      </div>

      {isFormOpen ? (
        <BrutalCard className="p-4" tone="lavender">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={createCategory}>
          <label className="grid gap-1 text-xs font-black uppercase">
            Nome
            <BrutalInput required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Tipo
            <BrutalSelect value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </BrutalSelect>
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Cor
            <BrutalSelect value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })}>
              {pastelPalette.map((color) => <option key={color} value={color}>{color}</option>)}
            </BrutalSelect>
          </label>
          <BrutalButton className="self-end" type="submit">
            <Plus size={16} />
            Criar
          </BrutalButton>
        </form>
        </BrutalCard>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="grid gap-3">
          <h2 className="font-display text-2xl font-black">Receitas</h2>
          {renderList(income)}
        </section>
        <section className="grid gap-3">
          <h2 className="font-display text-2xl font-black">Despesas</h2>
          {renderList(expense)}
        </section>
      </div>
    </div>
  );
}
