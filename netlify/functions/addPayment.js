import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "payments.json");
    const body = JSON.parse(event.body);

    let payments = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const newPayment = { id: Date.now().toString(), ...body };
    payments.push(newPayment);

    fs.writeFileSync(filePath, JSON.stringify(payments, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(newPayment),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao adicionar pagamento", details: error.message }),
    };
  }
}
