import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido",
    });
  }

  try {
    const { documento, senha } = req.body;

    if (!documento || !senha) {
      return res.status(400).json({
        erro: "Dados incompletos",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        c.*,
        e.nome_empresa,
        e.logo_simulador

      FROM clientes c

      INNER JOIN empresas e
        ON c.empresa_id = e.id

      WHERE c.cpf_cnpj = $1
        AND c.senha = $2
      `,
      [documento, senha],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: "Login inválido",
      });
    }

    const registros = result.rows;

    const base = registros[0];

    const tabelaMaquininha =
      registros.find((item) => item.tipo === "maquininha")?.tabela_nome || null;

    const tabelaLink =
      registros.find((item) => item.tipo === "link")?.tabela_nome || null;

    return res.status(200).json({
      sucesso: true,

      cliente_id: base.id,
      nome: base.nome,

      cpf_cnpj: base.cpf_cnpj,

      tabela_maquininha: tabelaMaquininha,

      tabela_link: tabelaLink,

      empresa_id: base.empresa_id,

      nome_empresa: base.nome_empresa,

      logo_simulador: base.logo_simulador,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro interno",
    });
  }
}
