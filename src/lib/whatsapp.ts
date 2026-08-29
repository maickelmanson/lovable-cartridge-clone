/** Utilitários para abrir conversas no WhatsApp via link wa.me (sem API/credenciais). */

/** Normaliza um telefone brasileiro para o formato internacional só com dígitos. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

/** Monta o link https://wa.me/<numero>?text=<mensagem codificada>. */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const numero = toWhatsAppNumber(phone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

/** Abre o WhatsApp em nova aba. Retorna false quando o telefone é inválido. */
export function openWhatsApp(phone: string | null | undefined, message: string): boolean {
  const link = buildWhatsAppLink(phone, message);
  if (!link) return false;
  window.open(link, "_blank", "noopener,noreferrer");
  return true;
}
