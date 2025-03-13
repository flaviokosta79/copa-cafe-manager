import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }
  try {
    const config = JSON.parse(event.body);
    const filePath = path.resolve(__dirname, "monthly-amount-config.json");
    
    // Sobrescreve o arquivo com a nova configuração
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    
    return { statusCode: 200, body: JSON.stringify({ success: true, config }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro ao atualizar configuração de valor mensal",
        details: error.message,
      }),
    };
  }
}
