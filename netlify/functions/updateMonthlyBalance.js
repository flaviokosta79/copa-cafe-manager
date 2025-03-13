import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "monthly-balances.json");
    const body = JSON.parse(event.body);

    let balances = [];
    if (fs.existsSync(filePath)) {
      balances = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    // Verifica se já existe um saldo para o mês fornecido
    const balanceIndex = balances.findIndex(b => b.month === body.month);

    if (balanceIndex !== -1) {
      // Atualiza o saldo existente
      balances[balanceIndex] = { ...balances[balanceIndex], ...body };
    } else {
      // Adiciona um novo saldo
      balances.push(body);
    }

    // Salva no arquivo JSON
    fs.writeFileSync(filePath, JSON.stringify(balances, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, updatedBalance: body }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao atualizar saldo mensal", details: error.message }),
    };
  }
}
