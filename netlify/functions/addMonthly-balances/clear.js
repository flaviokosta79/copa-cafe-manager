import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }
  try {
    // Supondo que o arquivo "monthly-balances.json" esteja na mesma pasta que os outros arquivos de configuração
    const filePath = path.resolve(__dirname, "../monthly-balances.json");
    
    // Limpa os saldos mensais escrevendo um array vazio
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Saldos mensais limpos" }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro ao limpar saldos mensais",
        details: error.message,
      }),
    };
  }
}
