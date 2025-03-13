import fs from "fs";
import path from "path";

export async function handler(event, context) {
  if (event.httpMethod !== "PUT") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const filePath = path.resolve(__dirname, "products.json");
    const body = JSON.parse(event.body);

    let products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Encontrando o produto e atualizando os dados
    const productIndex = products.findIndex(p => p.id === body.id);
    if (productIndex === -1) {
      return { statusCode: 404, body: "Produto não encontrado" };
    }

    products[productIndex] = { ...products[productIndex], ...body };

    // Salvando a lista de produtos atualizada
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(products[productIndex]),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao atualizar produto", details: error.message }),
    };
  }
}
