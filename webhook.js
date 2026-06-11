const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ MAPA DE PRODUTOS → LINKS
const produtos = {
  "PEDREIRO RESIDENCIAL BÁSICO":       "https://cursopedreiro.netlify.app/",
  "PEDREIRO RESIDENCIAL PREMIUM":      "https://cursopedreiro.netlify.app/",
  "Elétrica Residencial Básica":       "https://eletricaresidencial.netlify.app/",
  "Encanador Residencial Básico":      "https://encanador.netlify.app/",
  "Combo Profissional Completo — 4 Cursos": "https://kit-profissinonal.netlify.app/",
};

// Email de envio (domínio verificado no Resend)
const EMAIL_REMETENTE = "contato@receber-acesso.site";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "JSON inválido" };
  }

  const evento = body.event;
  const dados = body.data || {};

  const eventosAprovados = [
    "purchase.approved",
    "purchase.complete",
    "order.approved",
    "order.paid",
  ];

  if (!eventosAprovados.includes(evento)) {
    console.log(`Evento ignorado: ${evento}`);
    return { statusCode: 200, body: "Evento ignorado" };
  }

  const emailCliente =
    dados.customer?.email ||
    dados.buyer?.email ||
    dados.email ||
    null;

  const nomeCliente =
    dados.customer?.name ||
    dados.buyer?.name ||
    dados.name ||
    "aluno";

  const nomeProduto =
    dados.product?.name ||
    dados.plan?.name ||
    dados.offer?.name ||
    dados.item?.name ||
    null;

  if (!emailCliente) {
    console.error("Email do cliente não encontrado:", body);
    return { statusCode: 400, body: "Email do cliente não encontrado" };
  }

  // Busca o link pelo nome do produto
  const linkDoProduto = nomeProduto ? produtos[nomeProduto] : null;

  if (!linkDoProduto) {
    console.error(`Produto não encontrado no mapa: "${nomeProduto}"`);
    // Envia com link padrão para não perder a entrega
    linkFinal = "https://cursopedreiro.netlify.app/";
  } else {
    linkFinal = linkDoProduto;
  }

  // Nome amigável do produto para o email
  const nomeProdutoEmail = nomeProduto || "seu produto";

  try {
    await resend.emails.send({
      from: `Pedreiro Residencial <${EMAIL_REMETENTE}>`,
      to: emailCliente,
      subject: "🎉 Seu acesso está pronto!",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
                  
                  <!-- Cabeçalho -->
                  <tr>
                    <td style="background:#1a1a2e;padding:32px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">
                        Pedreiro Residencial
                      </h1>
                    </td>
                  </tr>

                  <!-- Corpo -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <p style="color:#333333;font-size:18px;font-weight:600;margin:0 0 16px;">
                        Olá, ${nomeCliente}! 👋
                      </p>
                      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 8px;">
                        Obrigado pela sua compra de <strong>${nomeProdutoEmail}</strong>!
                      </p>
                      <p style="color:#555555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                        Seu acesso está pronto. Clique no botão abaixo para acessar agora:
                      </p>

                      <!-- Botão -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                        <tr>
                          <td style="background:#e67e22;border-radius:8px;text-align:center;">
                            <a href="${linkFinal}"
                               style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                              Acessar meu produto →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color:#777777;font-size:14px;line-height:1.6;margin:0 0 8px;">
                        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                      </p>
                      <p style="margin:0;">
                        <a href="${linkFinal}" style="color:#e67e22;font-size:14px;word-break:break-all;">
                          ${linkFinal}
                        </a>
                      </p>
                    </td>
                  </tr>

                  <!-- Rodapé -->
                  <tr>
                    <td style="background:#f9f9f9;padding:24px 32px;border-top:1px solid #eeeeee;text-align:center;">
                      <p style="color:#aaaaaa;font-size:13px;margin:0;">
                        Dúvidas? Responda este email que te ajudamos.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`Email enviado para ${emailCliente} — produto: ${nomeProdutoEmail}`);
    return { statusCode: 200, body: "Email enviado com sucesso" };

  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return { statusCode: 500, body: "Erro ao enviar email" };
  }
};
