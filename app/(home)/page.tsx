import Movie from "./movie"
import styles from "./home.module.css"
import { API_URL } from "../constants"

export const metadata = { title: 'Home1' }

const Home = async () => {
    const movie = await (await fetch(API_URL)).json();
    return <main className={styles.mainContent}>
        <Movie movie={movie} />
    </main>
}
export default Home;
