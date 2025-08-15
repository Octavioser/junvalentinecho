import Gallery from "./Gallery";
import { getArtworks } from "@/common/comon";
;

export const metadata = { title: 'Home1' };

const Home = async () => {

    const data = await getArtworks();
    return <main>
        <Gallery artworks={data || []} />
    </main>;
};
export default Home;
