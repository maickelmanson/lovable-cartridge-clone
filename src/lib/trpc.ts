import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import type { TRPCLink } from "@trpc/client";

const t = initTRPC.create({ transformer: superjson });

const mockQuery = t.procedure.query(() => null as unknown as any);
const mockMutation = t.procedure.mutation(() => ({ success: true }) as unknown as any);

const appRouter = t.router({
  ai: t.router({ chat: mockMutation }),
  analise: t.router({
    clientesMaisAtivos: mockQuery,
    modelosMaisSolicitados: mockQuery,
    pedidosPorPeriodo: mockQuery,
    resumoGeral: mockQuery,
    statusPedidos: mockQuery,
  }),
  auth: t.router({
    logout: mockMutation,
    me: mockQuery,
  }),
  busca: t.router({ avancada: mockQuery }),
  buscadorCartuchos: t.router({ listar: mockQuery }),
  cartuchos: t.router({
    atualizar: mockMutation,
    criar: mockMutation,
    deletar: mockMutation,
    listar: mockQuery,
  }),
  clientes: t.router({
    atualizar: mockMutation,
    buscar: mockQuery,
    criar: mockMutation,
    deletar: mockMutation,
    listar: mockQuery,
  }),
  empresa: t.router({ obter: mockQuery, salvar: mockMutation }),
  erros: t.router({
    marcarResolvido: mockMutation,
    obterEstatisticas: mockQuery,
    obterNaoResolvidos: mockQuery,
    obterRecentes: mockQuery,
    obterResumo: mockQuery,
  }),
  pedidoCartuchos: t.router({
    adicionar: mockMutation,
    atualizar: mockMutation,
    listar: mockQuery,
    remover: mockMutation,
  }),
  pedidos: t.router({
    buscar: mockQuery,
    criar: mockMutation,
    deletar: mockMutation,
    duplicar: mockMutation,
    finalizar: mockMutation,
    listar: mockQuery,
    porCliente: mockQuery,
    reabrir: mockMutation,
  }),
  remanOrderItems: t.router({
    criar: mockMutation,
    deletar: mockMutation,
    listar: mockQuery,
  }),
  remanOrderUnits: t.router({
    criar: mockMutation,
    deletar: mockMutation,
    listar: mockQuery,
  }),
  remanOrders: t.router({
    atualizar: mockMutation,
    buscar: mockQuery,
    criar: mockMutation,
    deletar: mockMutation,
    listar: mockQuery,
    reabrir: mockMutation,
    relatorio: mockQuery,
  }),
  system: t.router({ gerarBackup: mockMutation }),
  voice: t.router({ transcribe: mockMutation }),
});

export type AppRouter = typeof appRouter;

export const trpc = createTRPCReact<AppRouter>() as unknown as any;

const listPaths = [
  "listar",
  "buscar",
  "obter",
  "porCliente",
  "avancada",
  "relatorio",
  "clientesMaisAtivos",
  "modelosMaisSolicitados",
  "pedidosPorPeriodo",
  "resumoGeral",
  "statusPedidos",
  "obterEstatisticas",
  "obterNaoResolvidos",
  "obterRecentes",
  "obterResumo",
];

const mockLink: TRPCLink<AppRouter> = () => ({ op }) => {
  return observable((observer) => {
    const path = op.path;
    const isList = listPaths.some((p) => path.endsWith(p));
    let data: unknown = isList ? [] : null;
    if (op.type === "mutation") {
      data = { success: true };
    }
    observer.next({ result: { type: "data", data } });
    observer.complete();
  });
};

export function createMockTRPCClient() {
  return trpc.createClient({ links: [mockLink] });
}
