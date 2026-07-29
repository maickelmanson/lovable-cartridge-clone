// Hybrid tRPC facade: real Supabase-backed namespaces mixed with mock hooks
// for legacy endpoints that haven't been migrated yet.
import { useQueryClient } from "@tanstack/react-query";
import { clientesApi } from "./trpc-real/clientes";
import { cartuchosApi } from "./trpc-real/cartuchos";
import { empresaApi } from "./trpc-real/empresa";
import { pedidosApi } from "./trpc-real/pedidos";
import { pedidoCartuchosApi } from "./trpc-real/pedidoCartuchos";
import { remanOrdersApi, remanOrderItemsApi, remanOrderUnitsApi } from "./trpc-real/reman";
import { aiApi } from "./trpc-real/ai";
import { buscaApi } from "./trpc-real/busca";
import { analiseApi } from "./trpc-real/analise";
import { errosApi } from "./trpc-real/erros";
import { systemApi } from "./trpc-real/system";
import { buscadorCartuchosApi } from "./trpc-real/buscadorCartuchos";

const REAL_NAMESPACES: Record<string, any> = {
  clientes: clientesApi,
  cartuchos: cartuchosApi,
  empresa: empresaApi,
  pedidos: pedidosApi,
  pedidoCartuchos: pedidoCartuchosApi,
  remanOrders: remanOrdersApi,
  remanOrderItems: remanOrderItemsApi,
  remanOrderUnits: remanOrderUnitsApi,
  ai: aiApi,
  busca: buscaApi,
  analise: analiseApi,
  erros: errosApi,
  system: systemApi,
  buscadorCartuchos: buscadorCartuchosApi,
};

const noop = () => {};
const noopAsync = async () => ({});

function createHookProxy(): any {
  return new Proxy(() => {}, {
    get(_t, prop) {
      if (prop === "useQuery") {
        return () => ({
          data: undefined,
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          isError: false,
          error: null,
          refetch: noop,
        });
      }
      if (prop === "useInfiniteQuery") {
        return () => ({
          data: null,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
          fetchNextPage: noop,
          hasNextPage: false,
        });
      }
      if (prop === "useMutation") {
        return () => ({
          mutate: noop,
          mutateAsync: noopAsync,
          isPending: false,
          isSuccess: false,
          isError: false,
          error: null,
          reset: noop,
        });
      }
      return createHookProxy();
    },
    apply() {
      return createHookProxy();
    },
  });
}

function useUtilsReal() {
  const qc = useQueryClient();
  return new Proxy(
    {},
    {
      get(_t, ns) {
        return new Proxy(
          {},
          {
            get(_t2, method) {
              return {
                invalidate: () =>
                  qc.invalidateQueries({ queryKey: [String(ns), String(method)] }),
                refetch: () =>
                  qc.refetchQueries({ queryKey: [String(ns), String(method)] }),
                reset: () => qc.resetQueries({ queryKey: [String(ns), String(method)] }),
              };
            },
          },
        );
      },
    },
  );
}

export const trpc: any = new Proxy(
  {},
  {
    get(_t, prop: string) {
      if (prop === "useUtils" || prop === "useContext") return useUtilsReal;
      if (typeof prop === "string" && prop in REAL_NAMESPACES) return REAL_NAMESPACES[prop];
      return createHookProxy();
    },
  },
);

export function createMockTRPCClient() {
  return {} as any;
}
