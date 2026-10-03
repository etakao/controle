/**
 * Preparação para Google OAuth.
 *
 * O schema já possui `provider` e `providerId`. Quando o Google OAuth entrar,
 * configure o provider no next-auth, normalize o perfil recebido, procure o
 * usuário por `(provider, providerId)` ou email verificado, e crie a sessão JWT
 * pelo mesmo fluxo usado nas credenciais.
 */
export const futureAuthProviders = {
  google: {
    enabled: false,
    note: "Integrar GoogleProvider do next-auth quando GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET existirem."
  }
};
