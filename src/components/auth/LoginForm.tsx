"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { signInWithPassword } from "@/app/auth/actions";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (next) formData.set("next", next);

    startTransition(async () => {
      const result = await signInWithPassword(formData);

      if (!result.ok) {
        setError(result.message ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(result.redirectTo ?? "/access-status");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
