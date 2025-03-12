
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProductsPage: React.FC = () => {
  const { products, addProduct, deleteProduct, formatCurrency, currentMonth } = useApp();
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    quantity: '1'
  });
  const { toast } = useToast();
  
  // Filtrar produtos apenas para o mês atual
  const currentMonthProducts = products.filter(product => product.month === currentMonth);
  
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = newProduct.name.trim();
    const price = parseFloat(newProduct.price);
    const quantity = parseInt(newProduct.quantity);
    
    if (!name) {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe um nome para o produto.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Preço inválido",
        description: "Por favor, informe um preço válido para o produto.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, informe uma quantidade válida para o produto.",
        variant: "destructive"
      });
      return;
    }
    
    addProduct(name, price, quantity);
    
    setNewProduct({
      name: '',
      price: '',
      quantity: '1'
    });
    
    toast({
      title: "Produto adicionado",
      description: `Produto "${name}" foi adicionado com sucesso.`
    });
  };
  
  const handleDeleteProduct = (productId: string, productName: string) => {
    deleteProduct(productId);
    
    toast({
      title: "Produto removido",
      description: `Produto "${productName}" foi removido com sucesso.`
    });
  };
  
  // Calcular o total de produtos para o mês atual
  const totalProductsValue = currentMonthProducts.reduce(
    (sum, product) => sum + (product.price * product.quantity),
    0
  );
  
  return (
    <Layout title="Produtos">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Novo Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1">
                  Nome do Produto
                </label>
                <Input
                  id="name"
                  placeholder="Café, Açúcar, etc."
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="price" className="text-sm font-medium block mb-1">
                  Preço (R$)
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="quantity" className="text-sm font-medium block mb-1">
                  Quantidade
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Produtos ({currentMonthProducts.length})</CardTitle>
          <div className="text-lg font-bold">
            Total: {formatCurrency(totalProductsValue)}
          </div>
        </CardHeader>
        <CardContent>
          {currentMonthProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.price * product.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum produto cadastrado para o mês atual. Adicione um produto usando o formulário acima.
            </p>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ProductsPage;
