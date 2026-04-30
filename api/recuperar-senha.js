import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function gerarSenha() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  // 🔥 LIBERAR CORS (COLE AQUI)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🔷 resposta para preflight (obrigatório)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔷 valida método
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { login } = req.body;

    if (!login) {
      return res.status(400).json({ erro: "Informe o login" });
    }

    const result = await pool.query("SELECT * FROM empresas WHERE login = $1", [
      login,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    const empresa = result.rows[0];

    if (!empresa.email) {
      return res.status(400).json({ erro: "Empresa sem email cadastrado" });
    }

    const novaSenha = gerarSenha();

    await pool.query("UPDATE empresas SET senha = $1 WHERE login = $2", [
      novaSenha,
      login,
    ]);

    // 🔥 por enquanto só log (depois colocamos email)
    console.log("Nova senha:", novaSenha);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Nova senha gerada",
      senha: novaSenha, // 🔥 MOSTRAR TEMPORARIAMENTE
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro interno" });
  }
}
