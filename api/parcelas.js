import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const { empresa_id, tabela_nome } = req.query;

    console.log("EMPRESA:", empresa_id);
    console.log("TABELA:", tabela_nome);

    if (!empresa_id || !tabela_nome) {
      return res.status(400).json({
        erro: "Dados incompletos",
      });
    }

    const result = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM taxas
      WHERE empresa_id = $1
        AND tabela_nome = $2
      `,
      [empresa_id, tabela_nome],
    );

    const total = Number(result.rows[0].total);

    console.log("TOTAL REGISTROS:", total);

    let maxParcelas = 12;

    if (total >= 23) {
      maxParcelas = 21;
    } else if (total >= 20) {
      maxParcelas = 18;
    } else {
      maxParcelas = 12;
    }

    return res.status(200).json({
      sucesso: true,
      total_registros: total,
      max_parcelas: maxParcelas,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro interno",
    });
  }
}
