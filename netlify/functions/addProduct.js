import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "products.json");
    const body = JSON.parse(event.body);

    let products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const newProduct = { id: Date.now().toString(), ...body };
    products.push(newProduct);

    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(newProduct),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao adicionar produto", details: error.message }),
    };
  }
}
