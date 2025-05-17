import styles from "./visual.module.css"
import { api } from "../common/comon";
import VisualDetail from "./visualDetail";

const Visual = async () => {

    const { ok, data: Artwork, error } = await api('/api/movie');

    const { container, left, right } = styles;
    return (
        <div className={container}>
            <VisualDetail Artwork={(Artwork || []).filter(({ visualYn }) => visualYn === 'Y')} />
        </div>
    );
}
export default Visual;