import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "products.json");
    const { productId } = JSON.parse(event.body);

    let products = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    products = products.filter(product => product.id !== productId);

    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao excluir produto", details: error.message }),
    };
  }
}
