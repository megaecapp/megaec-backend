import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  // 🔥 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    const result = await pool.query(
      "SELECT * FROM empresas WHERE login = $1 AND senha = $2",
      [login, senha],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Login inválido" });
    }

    const empresa = result.rows[0];

    return res.status(200).json({
      sucesso: true,
      empresa_id: empresa.id,
      nome_empresa: empresa.nome_empresa,
      logo_admin: empresa.logo_admin,
      banner_admin: empresa.banner_admin,
      logo_simulador: empresa.logo_simulador,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro interno" });
  }
}
