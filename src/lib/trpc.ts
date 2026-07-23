// Hybrid tRPC facade: real Supabase-backed namespaces mixed with mock hooks
// for legacy endpoints that haven't been migrated yet.
import { clientesApi } from "./trpc-real/clientes";

const REAL_NAMESPACES: Record<string, any> = {
  clientes: clientesApi,
};

const noop = () => {};
const noopAsync = async () => ({});

function createHookProxy(): any {
  return new Proxy(() => {}, {
    get(_target, prop) {
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
      if (prop === "useContext" || prop === "useUtils") {
        return () => ({
          invalidate: noop,
          refetch: noop,
          reset: noop,
        });
      }
      return createHookProxy();
    },
    apply(_target, _thisArg, _args) {
      return createHookProxy();
    },
  });
}

export const trpc: any = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (typeof prop === "string" && prop in REAL_NAMESPACES) return REAL_NAMESPACES[prop];
      return createHookProxy();
    },
  },
);

export function createMockTRPCClient() {
  return {} as any;
}
