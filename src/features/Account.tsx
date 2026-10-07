import { AccountIcon } from "../components/AccountIcon";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, Wallet } from "../api/contracts";
import { api, fieldErrors } from "../api/client";
import { keys } from "../app/query";
import { useNotify, useSession } from "../app/providers";
import { Button } from "../components/ui/button";
import {
  ErrorState,
  Field,
  FormError,
  Loading,
  Select,
} from "../components/shared";
import { useWallets } from "./hooks";
import { PasswordForm } from "./account/PasswordForm";
import { WalletForm } from "./account/WalletForm";

export function ProfilePage() {
  const user = useSession().data?.user;
  const profile = useQuery({
    queryKey: keys.profile(user?.id),
    queryFn: ({ signal }) => api.profile(signal),
    enabled: !!user,
  });
  if (profile.isPending) return <Loading kind="summary" />;
  if (profile.isError)
    return (
      <ErrorState error={profile.error} retry={() => void profile.refetch()} />
    );
  return (
    <>
      <div className="profile-forms">
        <ProfileForm user={profile.data} />
        <PasswordForm />
      </div>
    </>
  );
}
function ProfileForm({ user }: { user: User }) {
  const [data, setData] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    username: user.username ?? user.email.split("@")[0],
    ens: user.ens ?? "",
    walletAlias: user.walletAlias ?? "Minha carteira",
  });
  const avatarInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const client = useQueryClient();
  const notify = useNotify();
  const mutation = useMutation({
    mutationFn: () => api.updateProfile(data),
    onSuccess(updated) {
      client.setQueryData(keys.profile(user.id), updated);
      void client.invalidateQueries({ queryKey: keys.session });
      notify("Perfil salvo.");
    },
  });
  const fields = fieldErrors(mutation.error);
  function upload(file?: File) {
    setUploadError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 500000
    ) {
      setUploadError("Use PNG, JPEG ou WebP com menos de 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setData((old) => ({ ...old, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  }
  return (
    <form
      className="profile-form panel space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h1 className="text-xl font-semibold">Perfil do colecionador</h1>
      <div className="collector-fields">
        <Field
          label="Nome de exibição"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          required
          maxLength={80}
          autoComplete="name"
          error={fields.name}
        />
        <Field
          label="Nome de usuário"
          value={data.username}
          onChange={(e) => setData({ ...data, username: e.target.value })}
          required
          minLength={2}
          maxLength={32}
          error={fields.username}
        />
        <Field
          label="E-mail"
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          required
          autoComplete="email"
          error={fields.email}
        />
        <div className="account-ens">
          <Select label="Sufixo ENS" value=".eth" onChange={() => {}}>
            <option>.eth</option>
          </Select>
          <Field
            label="Nome ENS"
            value={data.ens}
            onChange={(e) => setData({ ...data, ens: e.target.value })}
            maxLength={120}
            error={fields.ens}
          />
        </div>
        <Field
          label="Apelido da carteira"
          value={data.walletAlias}
          onChange={(e) => setData({ ...data, walletAlias: e.target.value })}
          required
          maxLength={40}
          error={fields.walletAlias}
        />
        <div className="profile-avatar">
          <span>Avatar</span>
          {data.avatar ? (
            <img
              src={data.avatar}
              alt="Sua foto do perfil"
              width="80"
              height="80"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl text-background"
              role="img"
              aria-label="Avatar padrão do colecionador"
            >
              <AccountIcon name="avatar" />
            </div>
          )}
          <input
            ref={avatarInput}
            className="sr-only"
            aria-label="Foto do perfil"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <Button type="button" onClick={() => avatarInput.current?.click()}>
            Alterar
          </Button>
          {(uploadError || fields.avatar) && (
            <p role="alert" className="text-sm text-red-300">
              {uploadError || fields.avatar}
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setData({ ...data, avatar: "" })}
          >
            Remover
          </Button>
        </div>
      </div>
      <details className="profile-bio">
        <summary>Biografia (opcional)</summary>
        <label className="block space-y-2">
          <span className="text-sm">Bio</span>
          <textarea
            className="input"
            maxLength={280}
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            aria-invalid={!!fields.bio}
            aria-describedby={fields.bio ? "bio-error" : undefined}
          />
        </label>
        {fields.bio && (
          <p id="bio-error" className="text-sm text-red-300">
            {fields.bio}
          </p>
        )}
      </details>
      <FormError error={mutation.error} />
      <Button disabled={mutation.isPending || !!uploadError}>
        {mutation.isPending ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
export function WalletsPage() {
  const wallets = useWallets();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [copyPrimary, setCopyPrimary] = useState(false);
  const user = useSession().data?.user;
  const client = useQueryClient();
  const notify = useNotify();
  const primaryWallet =
    wallets.data?.find((wallet) => wallet.primary) ?? wallets.data?.[0];
  const save = useMutation({
    mutationFn: api.saveWallet,
    onSuccess(data) {
      client.setQueryData(keys.wallets(user?.id), data);
      setEditing(null);
      setCopyPrimary(false);
      notify("Carteira salva.");
    },
  });
  return (
    <>
      <header className="wallet-page-heading">
        <div>
          <h1>Carteira principal</h1>
          <p>
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs
            comprados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCopyPrimary(false);
            save.reset();
          }}
        >
          Adicionar
        </button>
      </header>
      {wallets.isPending ? (
        <Loading kind="summary" />
      ) : wallets.isError ? (
        <ErrorState
          error={wallets.error}
          retry={() => void wallets.refetch()}
        />
      ) : (
        <div className="wallet-manager">
          <WalletForm
            key={editing?.id ?? `new-${wallets.data?.length}-${copyPrimary}`}
            wallet={editing}
            defaults={
              copyPrimary && primaryWallet
                ? {
                    ...primaryWallet,
                    primary: false,
                  }
                : null
            }
            disabled={!editing && (wallets.data?.length ?? 0) >= 2}
            saving={save.isPending}
            error={save.error}
            onSave={(wallet) => save.mutate(wallet)}
            onCancel={() => {
              setEditing(null);
              save.reset();
            }}
          />
          <section className="secondary-wallet-heading">
            <h2>Carteira secundária</h2>
            <label className="wallet-copy-primary">
              <input
                type="checkbox"
                checked={copyPrimary}
                disabled={!wallets.data.length || wallets.data.length >= 2}
                onChange={(event) => {
                  setEditing(null);
                  setCopyPrimary(event.target.checked);
                  save.reset();
                }}
              />
              Igual à carteira principal
            </label>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCopyPrimary(false);
                save.reset();
                document
                  .getElementById("wallet-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Adicionar
            </button>
            <p>
              {(wallets.data?.length ?? 0) < 2
                ? "Você ainda não adicionou uma carteira secundária."
                : "Gerencie sua carteira secundária abaixo."}
            </p>
          </section>
          <details
            className="wallet-list"
            open={(wallets.data?.length ?? 0) >= 2}
          >
            <summary>Gerenciar carteiras cadastradas</summary>
            {wallets.data?.length ? (
              wallets.data.map((wallet) => (
                <article key={wallet.id} className="panel space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{wallet.label}</h2>
                    <span className="rounded-full bg-surface-raised px-3 py-1 text-xs">
                      {wallet.primary ? "Principal" : "Secundária"}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{wallet.network}</p>
                  <p className="break-all text-sm text-muted">
                    {wallet.address}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(wallet);
                      save.reset();
                    }}
                  >
                    Editar {wallet.label}
                  </Button>
                </article>
              ))
            ) : (
              <p className="panel">
                Nenhuma carteira cadastrada. Adicione uma para finalizar a
                compra.
              </p>
            )}
          </details>
        </div>
      )}
    </>
  );
}
