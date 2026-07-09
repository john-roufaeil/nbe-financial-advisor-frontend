import { useQuery } from "@tanstack/react-query";
import * as accountsApi from "@/api/accounts";
import * as accountsMock from "@/mocks/accounts";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";

function impl(source: DataSource) {
  return source === "mock" ? accountsMock : accountsApi;
}

export const accountKeys = {
  all: (source: DataSource) => ["accounts", source] as const,
};

export function useAccounts() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: accountKeys.all(source),
    queryFn: () => impl(source).getAccounts(),
  });
}
