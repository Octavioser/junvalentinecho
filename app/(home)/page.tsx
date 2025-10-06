import Gallery from "./Gallery";
import { getArtworks } from "@/common/comon";

export const metadata = { title: 'Home1' };

const Home = async () => {

    const data = await getArtworks();
    return <Gallery artworks={data || []} />;
};
export default Home;
