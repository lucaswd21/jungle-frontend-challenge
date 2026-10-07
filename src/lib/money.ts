import type { Eth } from "../api/contracts";
const SCALE = 10n ** 18n;
/** Parse decimal ETH exactly; transport never uses floating-point numbers. */
export function wei(value: Eth): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error("Invalid ETH decimal");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(18, "0"));
}
export function eth(value: bigint): Eth {
  const whole = value / SCALE;
  const fraction = (value % SCALE)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}
export function displayEth(value: Eth): string {
  return `${eth(wei(value))} ETH`;
}
