import styles from "./visual.module.css"
import { api } from "../common/comon";
import VisualDetail from "./visualDetail";

const Visual = async () => {

    const { ok, data: movie, error } = await api('/api/movie');

    const { container, left, right } = styles;
    return (
        <div className={container}>
            <VisualDetail movie={movie || []} />
        </div>
    );
}
export default Visual;