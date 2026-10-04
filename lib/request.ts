import { toast } from "sonner";

type ToastMessages = {
  /** Mensagem exibida em caso de sucesso. Omitida, nenhum toast de sucesso é exibido. */
  success?: string;
  /** Mensagem usada quando a API não retorna um erro próprio ou a requisição falha. */
  error: string;
};

/**
 * Executa uma requisição de escrita e notifica o resultado via toast.
 * Retorna o JSON da resposta em caso de sucesso, ou null em caso de erro.
 */
export async function requestWithToast<T = Record<string, unknown>>(
  input: RequestInfo,
  init: RequestInit,
  messages: ToastMessages
): Promise<T | null> {
  try {
    const response = await fetch(input, init);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? messages.error);
      return null;
    }

    if (messages.success) toast.success(messages.success);
    return data as T;
  } catch {
    toast.error(messages.error);
    return null;
  }
}
