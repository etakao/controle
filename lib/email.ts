/**
 * Envio de email desativado inicialmente.
 *
 * Quando o Controlê passar a enviar emails transacionais, reative este módulo,
 * configure RESEND_API_KEY e EMAIL_FROM no ambiente, e conecte as chamadas aos
 * fluxos de convite, verificação de email e recuperação de senha.
 */

// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function sendTransactionalEmail({
//   to,
//   subject,
//   html
// }: {
//   to: string;
//   subject: string;
//   html: string;
// }) {
//   if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
//     return;
//   }

//   await resend.emails.send({
//     from: process.env.EMAIL_FROM,
//     to,
//     subject,
//     html
//   });
// }
