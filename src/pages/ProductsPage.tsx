import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { PlusIcon, TrashIcon, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';

// Componente para edição de produto
const EditProductDialog: React.FC<{ product: Product, onSave: (updatedProduct: Product) => void }> = ({ product, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [quantity, setQuantity] = useState(product.quantity.toString());
  const { toast } = useToast();
  const { checkAdminPermission } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(price);
    const quantityValue = parseInt(quantity);
    
    if (!name.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe um nome para o produto.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Preço inválido",
        description: "Por favor, informe um preço válido maior que zero.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(quantityValue) || quantityValue <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, informe uma quantidade válida maior que zero.",
        variant: "destructive"
      });
      return;
    }
    
    checkAdminPermission(() => {
      const updatedProduct = { 
        ...product, 
        name,
        price: priceValue,
        quantity: quantityValue 
      };
      
      onSave(updatedProduct);
      setIsOpen(false);
      
      toast({
        title: "Produto atualizado",
        description: `Produto atualizado com sucesso.`
      });
    });
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover caracteres não numéricos, exceto vírgula e ponto
    const value = e.target.value.replace(/[^\d.,]/g, '');
    // Substituir vírgula por ponto para manipulação numérica
    const numericValue = value.replace(',', '.');
    setPrice(numericValue);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            setName(product.name);
            setPrice(product.price.toString());
            setQuantity(product.quantity.toString());
            setIsOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="product-name" className="text-sm font-medium">
              Nome do Produto
            </label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do produto"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="product-price" className="text-sm font-medium">
              Preço (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="product-price"
                value={price}
                onChange={handlePriceChange}
                className="pl-9"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="product-quantity" className="text-sm font-medium">
              Quantidade
            </label>
            <Input
              id="product-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ProductsPage: React.FC = () => {
  const { products, addProduct, deleteProduct, updateProduct, formatCurrency, currentMonth } = useApp();
  const { checkAdminPermission } = useAuth();
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    quantity: '1'
  });
  const { toast } = useToast();
  
  // Filtrar produtos apenas para o mês atual
  const currentMonthProducts = products.filter(product => product.month === currentMonth);
  
  // Calcular o valor total dos produtos do mês atual
  const totalProductsValue = currentMonthProducts.reduce(
    (total, product) => total + (product.price * product.quantity), 
    0
  );
  
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(newProduct.price);
    const quantity = parseInt(newProduct.quantity);
    
    if (!newProduct.name.trim()) {
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
        description: "Por favor, informe um preço válido maior que zero.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, informe uma quantidade válida maior que zero.",
        variant: "destructive"
      });
      return;
    }
    
    checkAdminPermission(() => {
      addProduct(newProduct.name, price, quantity);
      setNewProduct({
        name: '',
        price: '',
        quantity: '1'
      });
      
      toast({
        title: "Produto adicionado",
        description: `Produto "${newProduct.name}" foi adicionado com sucesso.`
      });
    });
  };
  
  const handleDeleteProduct = (productId: string, productName: string) => {
    checkAdminPermission(() => {
      deleteProduct(productId);
      
      toast({
        title: "Produto removido",
        description: `Produto "${productName}" foi removido com sucesso.`
      });
    });
  };
  
  const handleUpdateProduct = (updatedProduct: Product) => {
    checkAdminPermission(() => {
      updateProduct(updatedProduct);
    });
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover caracteres não numéricos, exceto vírgula e ponto
    const value = e.target.value.replace(/[^\d.,]/g, '');
    // Substituir vírgula por ponto para manipulação numérica
    const numericValue = value.replace(',', '.');
    setNewProduct({ ...newProduct, price: numericValue });
  };
  
  return (
    <Layout title="Produtos">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Novo Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-1">
                <Input
                  placeholder="Nome do produto"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div className="col-span-1 md:col-span-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  placeholder="Preço"
                  className="pl-9"
                  value={newProduct.price}
                  onChange={handlePriceChange}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <Input
                  type="number"
                  placeholder="Quantidade"
                  min="1"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto mt-4">
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price * product.quantity)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditProductDialog product={product} onSave={handleUpdateProduct} />
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
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
