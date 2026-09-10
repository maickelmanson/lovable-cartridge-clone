import { AlertCircle } from "lucide-react";

export function formatarCredito(valor: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(valor ?? 0) || 0,
  );
}

type Props = {
  valor: number | null | undefined;
  observacao?: string | null;
  clienteNome?: string | null;
  className?: string;
  children?: React.ReactNode;
};

/** Aviso destacado de crédito pendente do cliente. */
export default function AvisoCredito({ valor, observacao, clienteNome, className, children }: Props) {
  const credito = Number(valor ?? 0) || 0;
  if (credito <= 0) return null;

  return (
    <div
      className={`rounded-md border border-amber-400 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 ${className ?? ""}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-medium">
            {clienteNome ? `${clienteNome} possui ` : "Este cliente possui "}
            crédito pendente de {formatarCredito(credito)} para abater no pedido.
          </p>
          {observacao ? <p className="text-xs mt-1 opacity-90">{observacao}</p> : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
