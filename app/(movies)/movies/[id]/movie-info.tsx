import { API_URL } from "../../../constants";
import styles from "./movie-info.module.css"

export const getMovies = async (id: string) => (
    await (await fetch(`${API_URL}/${id}`)).json()
);

export default async function MovieInfo(
    { id }: { id: string }) {
    const { poster_path, title, vote_average, overview, homepage } = await getMovies(id);
    // throw new Error("something wrong~")
    return <div className={styles.container}>
        <img className={styles.poster} src={poster_path} alt={title}></img>
        <div className={styles.info}>
            <h1 >{title}</h1>
            <h3>⭐{vote_average.toFixed(2)}</h3>
            <p>{overview}</p>
            <a href={homepage} target={"_blank"}>Homepage &rarr;</a>
        </div>
    </div>
}
