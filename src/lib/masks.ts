/** Máscaras de formatação para documentos e telefones. */

export function onlyDigits(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Formata CNPJ como 99.999.999/9999-99 */
export function formatCNPJ(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 14);
  if (!d) return "";
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Formata CPF como 999.999.999-99 */
export function formatCPF(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11);
  if (!d) return "";
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Formata telefone/WhatsApp como (99) 99999-9999 (ou (99) 9999-9999). */
export function formatPhone(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Formata CPF ou CNPJ automaticamente conforme a quantidade de dígitos. */
export function formatDoc(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (!d) return "";
  return d.length > 11 ? formatCNPJ(d) : formatCPF(d);
}

/** Formata CEP como 99999-999 */
export function formatCEP(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
