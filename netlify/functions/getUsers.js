import fs from "fs";
import path from "path";

export async function handler(event, context) {
  try {
    const filePath = path.resolve(__dirname, "users.json"); // Caminho do arquivo
    const data = fs.readFileSync(filePath, "utf-8");
    const users = JSON.parse(data);

    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao ler usuários", details: error.message }),
    };
  }
}
