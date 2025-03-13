import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "users.json");
    const { userId } = JSON.parse(event.body);

    let users = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Filtrando para remover o usuário
    users = users.filter(user => user.id !== userId);

    // Salvando no arquivo JSON
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao excluir usuário", details: error.message }),
    };
  }
}
