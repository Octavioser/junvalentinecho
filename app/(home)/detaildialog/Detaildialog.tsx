import styles from "./detail.module.css"
import { ArtworkList } from "@/types";

const detaildaialog = ({ id, artworks }: { id: string, artworks: ArtworkList }) => {

    const { detaildialog, poster, info, container } = styles;

    const { overview, poster_path, title: movieTitle, size } = artworks.find(({ id: movieId }) => id === movieId);

    return <div className={detaildialog}>
        <div className={container}>
            <img className={poster} src={poster_path} alt={movieTitle}></img>
            <div className={info}>
                <h1 >{movieTitle}</h1>
                <h3>{size}</h3>
                <p>{overview}</p>
            </div>
        </div>
    </div>
}

export default detaildaialog;