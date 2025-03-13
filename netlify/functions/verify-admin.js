import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }
  try {
    const filePath = path.resolve(__dirname, "admin-config.json");
    const data = fs.readFileSync(filePath, "utf-8");
    const adminConfig = JSON.parse(data);

    const { password } = JSON.parse(event.body);
    // Compara a senha enviada com a armazenada (lembre-se: em produção, use hash!)
    if (adminConfig.password === password) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: "Senha incorreta" }) };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao verificar admin", details: error.message }),
    };
  }
}
