import { Eye } from "lucide-react";
import { AccountIcon } from "../../components/AccountIcon";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, fieldErrors } from "../../api/client";
import { useNotify } from "../../app/providers";
import { Button } from "../../components/ui/button";
import { Field, FormError } from "../../components/shared";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState<string[]>([]);
  const notify = useNotify();
  const mutation = useMutation({
    mutationFn: () => api.password({ current, password }),
    onSuccess() {
      setCurrent("");
      setPassword("");
      setConfirmation("");
      notify("Senha atualizada. Use a nova senha no próximo acesso.");
    },
  });
  const fields = fieldErrors(mutation.error);
  return (
    <form
      className="password-form panel space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (password === confirmation) mutation.mutate();
      }}
    >
      <h2 className="text-xl font-semibold">Alterar senha</h2>
      <div className="account-password-field">
        <Field
          label="Senha atual"
          type={visible.includes("Senha atual") ? "text" : "password"}
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={fields.current}
        />
        <button
          type="button"
          aria-label={`${visible.includes("Senha atual") ? "Ocultar" : "Mostrar"} senha atual`}
          aria-pressed={visible.includes("Senha atual")}
          onClick={() =>
            setVisible((old) =>
              old.includes("Senha atual")
                ? old.filter((item) => item !== "Senha atual")
                : [...old, "Senha atual"],
            )
          }
        >
          {visible.includes("Senha atual") ? (
            <Eye aria-hidden="true" />
          ) : (
            <AccountIcon name="password-hidden" />
          )}
        </button>
      </div>
      <div className="account-password-field">
        <Field
          label="Nova senha"
          type={visible.includes("Nova senha") ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fields.password}
        />
        <button
          type="button"
          aria-label={`${visible.includes("Nova senha") ? "Ocultar" : "Mostrar"} nova senha`}
          aria-pressed={visible.includes("Nova senha")}
          onClick={() =>
            setVisible((old) =>
              old.includes("Nova senha")
                ? old.filter((item) => item !== "Nova senha")
                : [...old, "Nova senha"],
            )
          }
        >
          {visible.includes("Nova senha") ? (
            <Eye aria-hidden="true" />
          ) : (
            <AccountIcon name="password-hidden" />
          )}
        </button>
      </div>
      <div className="account-password-field">
        <Field
          label="Confirmar nova senha"
          type={visible.includes("Confirmar nova senha") ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={
            confirmation && confirmation !== password
              ? "As senhas precisam ser iguais."
              : undefined
          }
        />
        <button
          type="button"
          aria-label={`${visible.includes("Confirmar nova senha") ? "Ocultar" : "Mostrar"} confirmar nova senha`}
          aria-pressed={visible.includes("Confirmar nova senha")}
          onClick={() =>
            setVisible((old) =>
              old.includes("Confirmar nova senha")
                ? old.filter((item) => item !== "Confirmar nova senha")
                : [...old, "Confirmar nova senha"],
            )
          }
        >
          {visible.includes("Confirmar nova senha") ? (
            <Eye aria-hidden="true" />
          ) : (
            <AccountIcon name="password-hidden" />
          )}
        </button>
      </div>
      <p className="sr-only">
        Use pelo menos 8 caracteres. As alterações são mantidas até reiniciar a
        demonstração.
      </p>
      <FormError error={mutation.error} />
      <Button disabled={mutation.isPending || password !== confirmation}>
        {mutation.isPending ? "Atualizando…" : "Salvar senha"}
      </Button>
    </form>
  );
}
