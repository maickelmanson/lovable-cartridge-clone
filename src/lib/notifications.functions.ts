import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NotificationChannel = "whatsapp" | "sms" | "email";

export type SendNotificationInput = {
  pedidoId?: number;
  clienteId?: number;
  channel?: NotificationChannel;
  destination?: string;
  message?: string;
};

function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // Assume Brazilian number if no country code
  if (digits.length <= 11) return `+55${digits}`;
  return `+${digits}`;
}

async function sendTwilioWhatsApp(to: string, body: string) {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const from = process.env["TWILIO_WHATSAPP_FROM"];

  if (!accountSid || !authToken || !from) {
    throw new Error("Credenciais Twilio não configuradas. Adicione TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM nas variáveis de ambiente.");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append("From", `whatsapp:${from}`);
  params.append("To", `whatsapp:${to}`);
  params.append("Body", body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json?.message || `Twilio error ${res.status}`);
  }
  return json?.sid as string | undefined;
}

export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SendNotificationInput) => {
    if (!data || typeof data !== "object") throw new Error("Dados inválidos");
    const channel = data.channel ?? "whatsapp";
    if (!["whatsapp", "sms", "email"].includes(channel)) throw new Error("Canal inválido");
    return {
      pedidoId: data.pedidoId,
      clienteId: data.clienteId,
      channel: channel as NotificationChannel,
      destination: data.destination,
      message: data.message,
    };
  })
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    // Resolve destination from cliente if not provided
    let destination = data.destination?.trim() || "";
    let clienteNome: string | null = null;

    if (data.clienteId && !destination) {
      const { data: cliente, error } = await supabase
        .from("clientes")
        .select("nome, telefone, telefone2")
        .eq("id", data.clienteId)
        .maybeSingle();
      if (error) throw error;
      if (!cliente) throw new Error("Cliente não encontrado");
      clienteNome = cliente.nome;
      const phone = sanitizePhone(cliente.telefone || cliente.telefone2);
      if (!phone) throw new Error("Cliente não possui telefone válido");
      destination = phone;
    }

    if (!destination) {
      throw new Error("Informe o destinatário ou um cliente com telefone");
    }

    // Build default message for orders
    let message = data.message?.trim() || "";
    if (!message && data.pedidoId) {
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("numero, status")
        .eq("id", data.pedidoId)
        .maybeSingle();
      if (pedidoError) throw pedidoError;
      const numero = pedido?.numero ?? String(data.pedidoId);
      const statusText = pedido?.status === "finalizado" ? "finalizado" : "em andamento";
      message = `Olá${clienteNome ? ` ${clienteNome}` : ""}, seu pedido #${numero} está ${statusText}. Entre em contato para mais informações.`;
    }

    if (!message) {
      throw new Error("Informe a mensagem ou um pedido para gerar mensagem automática");
    }

    // Insert pending notification
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        owner_id: userId,
        pedido_id: data.pedidoId,
        cliente_id: data.clienteId,
        channel: data.channel,
        destination,
        message,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    let status: "sent" | "failed" = "sent";
    let externalId: string | null = null;
    let errorMessage: string | null = null;

    try {
      if (data.channel === "whatsapp") {
        externalId = await sendTwilioWhatsApp(destination, message) ?? null;
      } else {
        throw new Error(`Canal ${data.channel} ainda não implementado`);
      }
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ status, external_id: externalId, error: errorMessage })
      .eq("id", notification.id);
    if (updateError) throw updateError;

    if (status === "failed") {
      throw new Error(errorMessage || "Falha ao enviar notificação");
    }

    return { id: notification.id, externalId };
  });
