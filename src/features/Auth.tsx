import { AccountIcon } from "../components/AccountIcon";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMobile } from "../lib/useMobile";
import { Catalog } from "./Catalog";
import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, fieldErrors } from "../api/client";
import { keys } from "../app/query";
import { useNotify } from "../app/providers";
import { Button } from "../components/ui/button";
import { Field, FormError } from "../components/shared";
export function AuthPage({ signup }: { signup: boolean }) {
  const mobile = useMobile();
  return (
    <>
      {!mobile && (
        <div className="auth-backdrop" aria-hidden="true" inert>
          <Catalog backdrop />
        </div>
      )}
      <AuthDialog signup={signup} />
    </>
  );
}
export function AuthDialog({
  signup,
  onClose,
  onModeChange,
  destination,
}: {
  signup: boolean;
  onClose?: () => void;
  onModeChange?: (signup: boolean) => void;
  destination?: string;
}) {
  const mobile = useMobile();
  const search = useSearch({ strict: false });
  const returnTo =
    destination ?? ("returnTo" in search ? search.returnTo : "/");
  const navigate = useNavigate();
  const client = useQueryClient();
  const notify = useNotify();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [open, setOpen] = useState(true);
  const mutation = useMutation({
    mutationFn: () =>
      signup
        ? api.signup({ name, email, password })
        : api.login({ email, password }),
    onSuccess: completeSession,
  });
  async function completeSession(
    session: Awaited<ReturnType<typeof api.login>>,
  ) {
    await client.cancelQueries();
    client.clear();
    client.setQueryData(keys.session, session);
    notify(signup ? "Sua conta está pronta." : "Você entrou na sua conta.");
    onClose?.();
    await navigate({ to: returnTo || "/" });
  }
  const social = useMutation({
    mutationFn: (provider: "google" | "facebook") =>
      api.login({
        email:
          provider === "google" ? "alex@example.test" : "maya@example.test",
        password: "Jungle123!",
      }),
    onSuccess: completeSession,
  });

  const errors = fieldErrors(mutation.error);
  return (
    <>
      <DialogPrimitive.Root
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            if (onClose) setOpen(false);
            else void navigate({ to: "/" });
          }
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="auth-overlay" />
          <DialogPrimitive.Content
            onInteractOutside={(event) => {
              const target = event.detail.originalEvent.target;
              if (
                target instanceof Element &&
                target.closest("[data-notification]")
              )
                event.preventDefault();
            }}
            className={`auth-card ${signup ? "signup-auth" : ""}`}
            aria-describedby="auth-description"
            onCloseAutoFocus={
              onClose
                ? (event) => {
                    event.preventDefault();
                    onClose();
                    document
                      .querySelector<HTMLButtonElement>("[data-login-trigger]")
                      ?.focus();
                  }
                : undefined
            }
          >
            <DialogPrimitive.Close
              className="auth-close"
              aria-label="Fechar diálogo"
            >
              <img
                src="/assets/kurio/close.svg"
                alt=""
                width="18"
                height="18"
              />
            </DialogPrimitive.Close>
            <p className="auth-wordmark">KURIO</p>
            <DialogPrimitive.Title className="auth-title">
              {mobile ? (
                signup ? (
                  "Criar perfil de colecionador"
                ) : (
                  "Entrar"
                )
              ) : (
                <span className="auth-tabs">
                  <Link
                    to="/login"
                    onClick={(event) => {
                      if (onModeChange) {
                        event.preventDefault();
                        onModeChange(false);
                      }
                    }}
                    className={!signup ? "selected" : ""}
                    search={{ returnTo: returnTo || "/" }}
                  >
                    Entrar
                  </Link>
                  <span>|</span>
                  <Link
                    to="/signup"
                    onClick={(event) => {
                      if (onModeChange) {
                        event.preventDefault();
                        onModeChange(true);
                      }
                    }}
                    className={signup ? "selected" : ""}
                    search={{ returnTo: returnTo || "/" }}
                  >
                    Criar conta
                  </Link>
                </span>
              )}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="auth-description"
              className="auth-intro"
            >
              {signup
                ? "Crie seu perfil de colecionador e conecte uma carteira quando quiser."
                : "Entre para gerenciar sua carteira, coleção e perfil de criador."}
            </DialogPrimitive.Description>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              {signup && (
                <Field
                  label="Nome completo"
                  placeholder="Nome de usuário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  autoComplete="name"
                  error={errors.name}
                />
              )}
              <Field
                label="E-mail"
                placeholder="Digite seu e-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                error={errors.email}
              />
              <div className="auth-password-field">
                <Field
                  label="Senha"
                  placeholder="Senha"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={signup ? "new-password" : "current-password"}
                  minLength={signup ? 8 : undefined}
                  required
                  error={errors.password}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                    </svg>
                  ) : (
                    <AccountIcon name="password-hidden" />
                  )}
                </button>
              </div>
              {signup && (
                <div className={mobile ? "auth-password-field" : undefined}>
                  <Field
                    label="Confirmar senha"
                    type={showConfirmation ? "text" : "password"}
                    placeholder="Confirmar senha"
                    autoComplete="new-password"
                    required
                    value={confirmation}
                    error={
                      confirmation && confirmation !== password
                        ? "As senhas precisam ser iguais."
                        : undefined
                    }
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                  {mobile && (
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={
                        showConfirmation
                          ? "Ocultar confirmação de senha"
                          : "Mostrar confirmação de senha"
                      }
                      aria-pressed={showConfirmation}
                      onClick={() => setShowConfirmation(!showConfirmation)}
                    >
                      {showConfirmation ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                        </svg>
                      ) : (
                        <AccountIcon name="password-hidden" />
                      )}
                    </button>
                  )}
                </div>
              )}
              {!signup && (
                <details className="forgot-password">
                  <summary>Esqueceu a senha?</summary>
                  <p>
                    Na demonstração, use Jungle123! nas contas de teste. Você
                    pode alterar a senha após entrar em Meu perfil.
                  </p>
                </details>
              )}
              <FormError error={mutation.error || social.error} />
              <Button
                className="w-full"
                aria-label={signup ? "Criar conta" : "Entrar"}
                disabled={
                  mutation.isPending || (signup && password !== confirmation)
                }
              >
                {mutation.isPending
                  ? "Aguarde…"
                  : signup
                    ? mobile
                      ? "Criar perfil"
                      : "Criar conta"
                    : "Entrar"}
              </Button>
            </form>
            <div className="social-auth">
              <p>Ou continue com</p>
              <Button
                type="button"
                variant="outline"
                disabled={social.isPending}
                onClick={() => social.mutate("google")}
              >
                <span className="google-mark" aria-hidden="true">
                  <svg viewBox="0 0 18 18" focusable="false">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.63-.06-1.24-.16-1.82H9v3.44h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.89 2.69-6.6Z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.47-.8 5.95-2.2l-2.91-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.97 10.7A5.4 5.4 0 0 1 3.69 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.03l3.01-2.33Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.57-2.57C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l3.01 2.33c.71-2.12 2.69-3.72 5.03-3.72Z"
                    />
                  </svg>
                </span>{" "}
                Continuar com Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={social.isPending}
                onClick={() => social.mutate("facebook")}
              >
                <span className="facebook-mark" aria-hidden="true">
                  f
                </span>{" "}
                Continuar com Facebook
              </Button>
            </div>
            {mobile && (
              <p className="mobile-auth-switch">
                {signup ? "Já tem uma conta? " : "Novo na Kurio? "}
                <Link
                  to={signup ? "/login" : "/signup"}
                  search={{ returnTo: returnTo || "/" }}
                  onClick={(event) => {
                    if (onModeChange) {
                      event.preventDefault();
                      onModeChange(!signup);
                    }
                  }}
                >
                  {signup ? "Entre" : "Crie uma conta"}
                </Link>
              </p>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
