"use client";

import { useQuery } from "@tanstack/react-query";

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar o grupo");
      }
      return response.json();
    },
    enabled: Boolean(groupId)
  });
}
