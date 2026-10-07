import { useState } from "react";
import type { Network, Wallet } from "../../api/contracts";
import { fieldErrors } from "../../api/client";
import { useSession } from "../../app/providers";
import { Button } from "../../components/ui/button";
import { Field, FormError, Select } from "../../components/shared";

export function WalletForm({
  wallet,
  defaults,
  disabled,
  saving,
  error,
  onSave,
  onCancel,
}: {
  wallet: Wallet | null;
  defaults?: Wallet | null;
  disabled: boolean;
  saving: boolean;
  error: unknown;
  onSave(data: Omit<Wallet, "id"> & { id?: string }): void;
  onCancel(): void;
}) {
  const initial = wallet ?? defaults;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [network, setNetwork] = useState<Network>(
    initial?.network ?? "Ethereum",
  );
  const user = useSession().data?.user;
  const [metadata, setMetadata] = useState({
    displayName: initial?.displayName ?? user?.name ?? "",
    profileName: initial?.profileName ?? user?.name ?? "",
    email: initial?.email ?? user?.email ?? "",
    provider: initial?.provider ?? "MetaMask",
    referral: initial?.referral ?? "JUNGLE",
    ens: initial?.ens ?? user?.ens ?? "",
    secondary: initial?.secondary ?? "",
  });
  const [primary, setPrimary] = useState(initial?.primary ?? false);
  const fields = fieldErrors(error);
  return (
    <form
      id="wallet-form"
      className="wallet-form panel space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: wallet?.id,
          label,
          address,
          network,
          primary,
          ...metadata,
        });
      }}
    >
      <h2 className="sr-only">
        {wallet ? "Editar carteira" : "Adicionar carteira"}
      </h2>
      {disabled && (
        <p className="text-sm text-muted">
          Você tem duas carteiras. Selecione uma para editar.
        </p>
      )}
      <div className="collector-fields">
        <Field
          label="Nome de exibição"
          value={metadata.displayName}
          required
          maxLength={80}
          disabled={disabled}
          error={fields.displayName}
          onChange={(e) =>
            setMetadata({ ...metadata, displayName: e.target.value })
          }
        />
        <Field
          label="Apelido da carteira"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          maxLength={40}
          disabled={disabled}
          error={fields.label}
        />
        <Select
          label="Rede"
          value={network}
          onChange={(value) => setNetwork(value as Network)}
          error={fields.network}
        >
          <option>Ethereum</option>
          <option>Polygon</option>
        </Select>
        <Field
          label="Nome do perfil"
          value={metadata.profileName}
          required
          maxLength={80}
          disabled={disabled}
          error={fields.profileName}
          onChange={(e) =>
            setMetadata({ ...metadata, profileName: e.target.value })
          }
        />
        <Field
          label="Endereço da carteira"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Endereço 0x da carteira"
          required
          disabled={disabled}
          error={fields.address}
        />
        <div className="wallet-secondary-address">
          <Field
            label="Carteira secundária (opcional)"
            value={metadata.secondary}
            maxLength={120}
            disabled={disabled}
            error={fields.secondary}
            placeholder="ENS ou carteira secundária (opcional)"
            onChange={(e) =>
              setMetadata({ ...metadata, secondary: e.target.value })
            }
          />
        </div>
        <Select
          label="Tipo de carteira"
          value={metadata.provider}
          onChange={(value) =>
            setMetadata({
              ...metadata,
              provider: value as typeof metadata.provider,
            })
          }
          error={fields.provider}
        >
          <option>MetaMask</option>
          <option>WalletConnect</option>
          <option>Coinbase Wallet</option>
        </Select>
        <Field
          label="Código de indicação"
          value={metadata.referral}
          required
          maxLength={32}
          disabled={disabled}
          error={fields.referral}
          onChange={(e) =>
            setMetadata({ ...metadata, referral: e.target.value })
          }
        />
        <Field
          label="E-mail"
          type="email"
          value={metadata.email}
          required
          autoComplete="email"
          disabled={disabled}
          error={fields.email}
          onChange={(e) => setMetadata({ ...metadata, email: e.target.value })}
        />
        <div className="account-ens">
          <Select label="Sufixo ENS" value=".eth" onChange={() => {}}>
            <option>.eth</option>
          </Select>
          <Field
            label="Nome ENS"
            value={metadata.ens}
            maxLength={120}
            disabled={disabled}
            error={fields.ens}
            onChange={(e) => setMetadata({ ...metadata, ens: e.target.value })}
          />
        </div>
      </div>
      <label className="wallet-primary-choice flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={primary}
          onChange={(e) => setPrimary(e.target.checked)}
          disabled={disabled}
          className="h-5 w-5 accent-primary"
        />
        Definir como carteira principal
      </label>
      <FormError error={error} />
      <div className="flex gap-3">
        <Button disabled={saving || disabled}>
          {saving ? "Salvando…" : "Salvar carteira"}
        </Button>
        {wallet && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar edição
          </Button>
        )}
      </div>
    </form>
  );
}
