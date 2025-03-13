import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }
  try {
    const newBalance = JSON.parse(event.body);
    const filePath = path.resolve(__dirname, "monthly-balances.json");
    let balances = [];

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      balances = JSON.parse(data);
    }

    // Verifica se já existe um saldo para o mês informado
    const index = balances.findIndex(b => b.month === newBalance.month);
    if (index !== -1) {
      balances[index] = { ...balances[index], ...newBalance };
    } else {
      balances.push(newBalance);
    }

    fs.writeFileSync(filePath, JSON.stringify(balances, null, 2));
    return { statusCode: 200, body: JSON.stringify({ success: true, balances }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro ao atualizar saldo mensal",
        details: error.message,
      }),
    };
  }
}
