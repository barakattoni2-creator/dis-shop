import Layout from "@/components/Layout";
import FeaturedProducts from "@/components/FeaturedProducts";
import { fetchProducts } from "@/lib/catalog";

export async function getStaticProps() {
  const products = await fetchProducts().catch(() => []);
  return { props: { products }, revalidate: 60 };
}

export default function ShopPage({ products }) {
  return (
    <Layout
      title="Shop All Products"
      description="Browse the full DIS Shop catalog: air conditioners, solar, electricals, home & kitchen, power tools, household supplies, cleaning, lighting, water pumps and generators."
    >
      <FeaturedProducts products={products} heading="Shop All Products" />
    </Layout>
  );
}
