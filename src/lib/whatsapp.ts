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

/** Variáveis disponíveis nas mensagens padrão. */
export const TEMPLATE_VARS = [
  { nome: "cliente", descricao: "Nome do cliente" },
  { nome: "pedido", descricao: "Número do pedido" },
  { nome: "status", descricao: "Status do pedido por extenso" },
  { nome: "empresa", descricao: "Nome da empresa cadastrada" },
] as const;

/** Textos originais de fábrica, por chave de template. */
export const TEMPLATE_PADRAO: Record<string, string> = {
  pedido_em_andamento:
    "Olá {cliente}, seu pedido #{pedido} está em andamento. Qualquer dúvida estamos à disposição.",
  pedido_finalizado:
    "Olá {cliente}, seu pedido #{pedido} está finalizado. Qualquer dúvida estamos à disposição.",
  mensagem_livre: "Olá {cliente}, aqui é da {empresa}. Podemos falar sobre o pedido #{pedido}?",
};

/** Substitui {variavel} pelos valores informados, limpando espaços duplicados. */
export function renderTemplate(corpo: string, vars: Record<string, string | null | undefined>): string {
  return (corpo ?? "")
    .replace(/\{(\w+)\}/g, (match, nome: string) => {
      const valor = vars[nome];
      return valor == null ? match : String(valor);
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
