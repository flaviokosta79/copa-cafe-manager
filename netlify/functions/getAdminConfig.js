import fs from "fs";
import path from "path";

export async function handler(event, context) {
  try {
    const filePath = path.resolve(__dirname, "admin-config.json");
    const data = fs.readFileSync(filePath, "utf-8");
    const config = JSON.parse(data);

    return {
      statusCode: 200,
      body: JSON.stringify(config),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao obter configurações do administrador", details: error.message }),
    };
  }
}
