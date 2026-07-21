// Moved to /track-order to match the public route naming — kept as a
// permanent redirect so existing bookmarks/links to /orders still work.
export async function getServerSideProps() {
  return { redirect: { destination: "/track-order", permanent: true } };
}

export default function OrdersRedirect() {
  return null;
}
