export interface DummyProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  weight: number;
}

interface DummyProductsResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

const API_URL = "https://dummyjson.com/products";

export async function fetchProducts(): Promise<DummyProduct[]> {
  const response = await fetch(`${API_URL}?limit=100&select=id,title,category,price,discountPercentage,rating,stock,brand,weight`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  const data: DummyProductsResponse = await response.json();
  return data.products;
}
