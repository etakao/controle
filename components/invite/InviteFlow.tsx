"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalInput } from "@/components/ui/BrutalInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { requestWithToast } from "@/lib/request";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { StoredUser, useAuthStore } from "@/stores/authStore";

type InviteGroup = { id: string; name: string; description?: string | null };
type Step = "loading" | "invalid" | "invite" | "login" | "register";
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const textLinkClass = "underline decoration-2 underline-offset-4";

export function InviteFlow({ token }: { token: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [group, setGroup] = useState<InviteGroup | null>(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.group) {
          setGroup(data.group);
          setStep("invite");
        } else {
          setError(data.error ?? "Convite inválido ou expirado.");
          setStep("invalid");
        }
      })
      .catch(() => {
        setError("Não foi possível carregar o convite.");
        setStep("invalid");
      });
  }, [token]);

  /** Entra no grupo com a sessão atual. Retorna false quando não há sessão. */
  async function joinGroup() {
    const response = await fetch(`/api/invite/${token}`, { method: "POST" });
    if (response.status === 401) return false;

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Não foi possível aceitar o convite.");
    }

    toast.success("Convite aceito.");
    router.push(`/groups/${data.groupId}`);
    router.refresh();
    return true;
  }

  async function acceptInvite() {
    setAccepting(true);
    try {
      const joined = await joinGroup();
      if (!joined) setStep("login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível aceitar o convite.");
    } finally {
      setAccepting(false);
    }
  }

  if (step === "loading" || step === "invalid") {
    return (
      <BrutalCard className="p-6" tone="peach">
        <h1 className="font-display text-2xl font-black">Convite Controlê</h1>
        <p className="mt-4 font-bold">{step === "loading" ? "Carregando convite..." : error}</p>
        {step === "invalid" ? (
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white px-4 py-2 text-sm font-black shadow-brutal"
            href="/login"
          >
            <LogIn size={16} />
            Ir para o login
          </Link>
        ) : null}
      </BrutalCard>
    );
  }

  if (step === "invite") {
    return (
      <BrutalCard className="p-6" tone="peach">
        <h1 className="font-display text-2xl font-black">Convite Controlê</h1>
        <div className="mt-4 grid gap-4">
          <p className="text-lg font-black">Você foi convidado para participar de {group?.name}.</p>
          {group?.description ? <p className="font-bold">{group.description}</p> : null}
          <BrutalButton disabled={accepting} onClick={acceptInvite}>
            <Check size={16} />
            {accepting ? "Aceitando..." : "Aceitar convite"}
          </BrutalButton>
        </div>
      </BrutalCard>
    );
  }

  return step === "login" ? (
    <InviteLoginForm groupName={group?.name} onJoin={joinGroup} onSwitch={() => setStep("register")} />
  ) : (
    <InviteRegisterForm groupName={group?.name} token={token} onSwitch={() => setStep("login")} />
  );
}

type InviteLoginFormProps = {
  groupName?: string;
  onJoin: () => Promise<boolean>;
  onSwitch: () => void;
};

function InviteLoginForm({ groupName, onJoin, onSwitch }: InviteLoginFormProps) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    const data = await requestWithToast<{ user: StoredUser; token: string }>(
      "/api/auth/login",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) },
      { error: "Não foi possível entrar." }
    );
    if (!data) return;

    setAuth(data.user, data.token);
    try {
      await onJoin();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível aceitar o convite.");
    }
  }

  return (
    <BrutalCard className="p-6" tone="lavender">
      <h1 className="font-display text-2xl font-black">Entrar</h1>
      <p className="mt-2 text-sm font-bold">Entre na sua conta para participar de {groupName ?? "grupo"}.</p>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-1 text-xs font-black uppercase">
          Email
          <BrutalInput autoComplete="email" autoFocus {...register("email")} />
          {errors.email ? <span className="text-sm normal-case text-red-700">{errors.email.message}</span> : null}
        </label>
        <label className="grid gap-1 text-xs font-black uppercase">
          Senha
          <PasswordInput autoComplete="current-password" {...register("password")} />
          {errors.password ? <span className="text-sm normal-case text-red-700">{errors.password.message}</span> : null}
        </label>
        <BrutalButton disabled={isSubmitting} type="submit">
          <LogIn size={16} />
          {isSubmitting ? "Entrando..." : "Entrar e aceitar convite"}
        </BrutalButton>
      </form>
      <p className="mt-4 text-sm font-bold">
        Não tem uma conta?{" "}
        <button className={textLinkClass} type="button" onClick={onSwitch}>
          Cadastre-se
        </button>
      </p>
    </BrutalCard>
  );
}

type InviteRegisterFormProps = {
  groupName?: string;
  token: string;
  onSwitch: () => void;
};

function InviteRegisterForm({ groupName, token, onSwitch }: InviteRegisterFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    const data = await requestWithToast<{ user: StoredUser; token: string; groupId: string }>(
      "/api/auth/register",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, inviteToken: token }) },
      { success: "Conta criada. Convite aceito.", error: "Não foi possível criar sua conta." }
    );
    if (!data) return;

    setAuth(data.user, data.token);
    router.push(`/groups/${data.groupId}`);
    router.refresh();
  }

  return (
    <BrutalCard className="p-6" tone="mint">
      <h1 className="font-display text-2xl font-black">Criar conta</h1>
      <p className="mt-2 text-sm font-bold">Crie sua conta para participar de {groupName ?? "grupo"}.</p>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-1 text-xs font-black uppercase">
          Nome
          <BrutalInput autoComplete="name" autoFocus {...register("name")} />
          {errors.name ? <span className="text-sm normal-case text-red-700">{errors.name.message}</span> : null}
        </label>
        <label className="grid gap-1 text-xs font-black uppercase">
          Email
          <BrutalInput autoComplete="email" {...register("email")} />
          {errors.email ? <span className="text-sm normal-case text-red-700">{errors.email.message}</span> : null}
        </label>
        <label className="grid gap-1 text-xs font-black uppercase">
          Senha
          <PasswordInput autoComplete="new-password" {...register("password")} />
          {errors.password ? <span className="text-sm normal-case text-red-700">{errors.password.message}</span> : null}
        </label>
        <BrutalButton disabled={isSubmitting} type="submit">
          <UserPlus size={16} />
          {isSubmitting ? "Criando..." : "Criar conta e aceitar convite"}
        </BrutalButton>
      </form>
      <p className="mt-4 text-sm font-bold">
        Já tem uma conta?{" "}
        <button className={textLinkClass} type="button" onClick={onSwitch}>
          Entrar
        </button>
      </p>
    </BrutalCard>
  );
}
