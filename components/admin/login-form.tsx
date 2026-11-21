"use client";

import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Field } from "./fields";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email";
    if (!password) nextErrors.password = "Enter your password";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      toast.error("Sign in failed", { description: error.message });
      return;
    }
    toast.success("Signed in");
    router.replace(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
      <Field id="email" label="Email" error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input"
          value={email}
          aria-invalid={Boolean(errors.email) || undefined}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="input"
          value={password}
          aria-invalid={Boolean(errors.password) || undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Sign in
      </button>
    </form>
  );
}
