import fs from "fs";
import path from "path";

export async function handler(event, context) {
  try {
    const filePath = path.resolve(__dirname, "products.json");
    const data = fs.readFileSync(filePath, "utf-8");
    const products = JSON.parse(data);

    return {
      statusCode: 200,
      body: JSON.stringify(products),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao buscar produtos", details: error.message }),
    };
  }
}
