/* =========================================================
   🔷 API TABELAS - LISTAR TABELAS DISPONÍVEIS
   Projeto: MegaEC Backend
   Objetivo: Retornar lista de tabelas cadastradas no banco
   ========================================================= */

import { neon } from "@neondatabase/serverless";

/* 🔷 CONEXÃO COM BANCO */
const sql = neon(process.env.DATABASE_URL);

/* =========================================================
   🔷 FUNÇÃO PRINCIPAL (ROTA /api/tabelas)
   ========================================================= */
export default async function handler(req, res) {
  /* =========================================================
     🔷 LIBERAÇÃO DE CORS
     ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  /* 🔹 Responde preflight */
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* 🔹 Permitir apenas GET */
  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    /* =========================================================
       🔷 BUSCAR TABELAS NO BANCO
       ========================================================= */
    const resultado = await sql`
      SELECT nome_tabela, tipo
      FROM tabelas_taxas
      ORDER BY nome_tabela
    `;

    /* =========================================================
       🔷 RETORNAR DADOS
       ========================================================= */
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar tabelas:", error);

    return res.status(500).json({
      erro: "Erro interno no servidor",
    });
  }
}
