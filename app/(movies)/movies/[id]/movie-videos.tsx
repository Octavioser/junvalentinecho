import { API_URL } from "../../../constants";
import styles from "./movie-videos.module.css"


const getVideos = async (id: string) => (
    await (await fetch(`${API_URL}/${id}/videos`)).json()
);

export default async function MovieVideos(
    { id }: { id: string }) {
    const videos = await getVideos(id);
    const { container } = styles;
    return <div className={container}>
        {videos.map(({ id: videoId, key, name }) =>
            <iframe key={videoId}
                src={`https://youtube.com/embed/${key}`}
                title={name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        )}
    </div>
}

