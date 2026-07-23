import HomepageView from "@/features/homepage/HomepageView";
import { getHomepageProps } from "@/features/homepage/getHomepageProps";

export async function getStaticProps() {
  const props = await getHomepageProps();
  return { props, revalidate: 60 };
}

export default function Home(props) {
  return <HomepageView {...props} />;
}
