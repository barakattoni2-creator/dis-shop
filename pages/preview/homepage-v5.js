import HomepageView from "@/features/homepage/HomepageView";
import { getHomepageProps } from "@/features/homepage/getHomepageProps";

// Preview infrastructure (see DIS Shop's preview→review→approval→production
// workflow). Renders the exact same HomepageView component, fed by the
// exact same live data, as production's pages/index.js — this file adds no
// UI changes of its own. When a future round makes real changes for this
// version, that work happens here (or in a version-specific fork of
// HomepageView, if V5 and production need to diverge) rather than in
// pages/index.js. Only promote to production after explicit approval.
export async function getStaticProps() {
  const props = await getHomepageProps();
  return { props, revalidate: 60 };
}

export default function HomepageV5Preview(props) {
  return <HomepageView {...props} previewLabel="Homepage V5" />;
}
