const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const produtos = {
  "PEDREIRO RESIDENCIAL BÁSICO":            "https://cursopedreiro.netlify.app/",
  "PEDREIRO RESIDENCIAL PREMIUM":           "https://cursopedreiro.netlify.app/",
  "Elétrica Residencial Básica":            "https://eletricaresidencial.netlify.app/",
  "Encanador Residencial Básico":           "https://encanador.netlify.app/",
  "Combo Profissional Completo — 4 Cursos": "https://kit-profissinonal.netlify.app/",
};

const EMAIL_REMETENTE = "contato@receber-acesso.site";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "JSON invalido" };
  }

  const evento = body.event;
  const dados = body.data || body;

  const eventosAprovados = [
    "purchase.approved",
    "purchase.complete",
    "order.approved",
    "order.paid",
    "SALE_APPROVED",
    "sale.approved",
    "sale_approved",
  ];

  if (!eventosAprovados.includes(evento)) {
    console.log("Evento ignorado: " + evento);
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
    (dados.products && dados.products[0]?.name) ||
    (dados.products && dados.products[0]?.offer_name) ||
    dados.product?.name ||
    dados.plan?.name ||
    dados.offer?.name ||
    dados.offer_name ||
    dados.item?.name ||
    null;

  if (!emailCliente) {
    console.error("Email do cliente nao encontrado:", body);
    return { statusCode: 400, body: "Email do cliente nao encontrado" };
  }

  const linkDoProduto = nomeProduto ? produtos[nomeProduto] : null;
  let linkFinal;

  if (!linkDoProduto) {
    console.error("Produto nao encontrado no mapa: " + nomeProduto);
    linkFinal = "https://cursopedreiro.netlify.app/";
  } else {
    linkFinal = linkDoProduto;
  }

  const nomeProdutoEmail = nomeProduto || "seu curso";

  try {
    await resend.emails.send({
      from: "Pedreiro Residencial <" + EMAIL_REMETENTE + ">",
      to: emailCliente,
      subject: "Seu acesso foi liberado",
      html: [
        '<!DOCTYPE html>',
        '<html lang="pt-BR">',
        '<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>',
        '<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">',
        '<tr><td align="center">',
        '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">',
        '<tr><td style="background:#1a1a2e;padding:28px 32px;">',
        '<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Pedreiro Residencial</h1>',
        '</td></tr>',
        '<tr><td style="padding:36px 32px;">',
        '<p style="color:#333333;font-size:16px;margin:0 0 16px;">Ola, ' + nomeCliente + '.</p>',
        '<p style="color:#555555;font-size:15px;line-height:1.7;margin:0 0 16px;">',
        'Sua compra de <strong>' + nomeProdutoEmail + '</strong> foi confirmada e seu acesso esta disponivel.',
        '</p>',
        '<p style="color:#555555;font-size:15px;line-height:1.7;margin:0 0 28px;">Clique no botao abaixo para entrar na plataforma:</p>',
        '<table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">',
        '<tr><td style="background:#2c6e49;border-radius:6px;text-align:center;">',
        '<a href="' + linkFinal + '" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">',
        'Acessar plataforma',
        '</a></td></tr></table>',
        '<p style="color:#888888;font-size:13px;margin:0 0 6px;">Caso o botao nao funcione, copie e cole este link no navegador:</p>',
        '<p style="margin:0;"><a href="' + linkFinal + '" style="color:#2c6e49;font-size:13px;word-break:break-all;">' + linkFinal + '</a></p>',
        '</td></tr>',
        '<tr><td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #eeeeee;">',
        '<p style="color:#aaaaaa;font-size:12px;margin:0;">Pedreiro Residencial — contato@receber-acesso.site</p>',
        '</td></tr>',
        '</table></td></tr></table>',
        '</body></html>'
      ].join('\n'),
    });

    console.log("Email enviado para " + emailCliente + " — produto: " + nomeProdutoEmail);
    return { statusCode: 200, body: "Email enviado com sucesso" };

  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return { statusCode: 500, body: "Erro ao enviar email" };
  }
};
