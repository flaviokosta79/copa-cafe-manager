import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "payments.json");
    const { paymentId } = JSON.parse(event.body);

    let payments = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    payments = payments.filter(payment => payment.id !== paymentId);

    fs.writeFileSync(filePath, JSON.stringify(payments, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao excluir pagamento", details: error.message }),
    };
  }
}
