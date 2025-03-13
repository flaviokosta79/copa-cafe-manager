import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "users.json");
    const body = JSON.parse(event.body);

    // Lendo os usuários existentes
    let users = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Adicionando o novo usuário
    const newUser = { id: Date.now().toString(), ...body };
    users.push(newUser);

    // Salvando no arquivo JSON
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(newUser),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao adicionar usuário", details: error.message }),
    };
  }
}
