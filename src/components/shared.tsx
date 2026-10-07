import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { Button } from "./ui/button";
import { errorMessage } from "../api/client";
export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        {...props}
        aria-label={props["aria-label"] ?? label}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="input"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
export function Select({
  label,
  value,
  onChange,
  children,
  id,
  error,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  children: ReactNode;
  id?: string;
  error?: string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className="space-y-2">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <select
        id={fieldId}
        aria-label={label}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      >
        {children}
      </select>
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      data-testid="skeleton"
      className={`skeleton ${className}`}
      aria-hidden="true"
    />
  );
}
export function Loading({
  kind = "cards",
}: {
  kind?: "cards" | "detail" | "summary";
}) {
  return (
    <div role="status" aria-label="Carregando conteúdo">
      <span className="sr-only">Carregando conteúdo</span>
      {kind === "cards" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : kind === "detail" ? (
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-36" />
            <Skeleton className="h-48" />
          </div>
        </div>
      ) : (
        <Skeleton className="h-80 rounded-3xl" />
      )}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div role="alert" className="panel space-y-4">
      <h2 className="text-xl font-semibold">
        Não foi possível carregar este conteúdo
      </h2>
      <p className="text-muted">{errorMessage(error)}</p>
      {retry && <Button onClick={retry}>Tentar novamente</Button>}
    </div>
  );
}
export function FormError({ error }: { error: unknown }) {
  return error ? (
    <p
      role="alert"
      className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
    >
      {errorMessage(error)}
    </p>
  ) : null;
}
export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h1
        aria-label={title}
        className="text-3xl font-semibold tracking-tight md:text-5xl"
      >
        {title}
      </h1>
      {children && <div className="mt-4 text-muted">{children}</div>}
    </div>
  );
}
