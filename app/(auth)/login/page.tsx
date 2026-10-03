"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalInput } from "@/components/ui/BrutalInput";
import { loginSchema } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/authStore";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  async function onSubmit(values: LoginForm) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Nao foi possivel entrar");
    }

    setAuth(data.user, data.token);
    const redirectTo = new URLSearchParams(window.location.search).get("redirect") ?? "/";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <BrutalCard className="p-6" tone="lavender">
      <h1 className="font-display text-2xl font-black">Entrar no Controle</h1>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-1 text-xs font-black uppercase">
          Email
          <BrutalInput autoComplete="email" {...register("email")} />
          {errors.email ? <span className="text-sm normal-case text-red-700">{errors.email.message}</span> : null}
        </label>
        <label className="grid gap-1 text-xs font-black uppercase">
          Senha
          <BrutalInput autoComplete="current-password" type="password" {...register("password")} />
          {errors.password ? <span className="text-sm normal-case text-red-700">{errors.password.message}</span> : null}
        </label>
        <BrutalButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </BrutalButton>
      </form>
    </BrutalCard>
  );
}
