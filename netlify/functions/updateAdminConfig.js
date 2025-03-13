import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "admin-config.json");
    const body = JSON.parse(event.body);

    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao atualizar configurações do administrador", details: error.message }),
    };
  }
}
