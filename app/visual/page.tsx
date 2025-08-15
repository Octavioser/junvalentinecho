import styles from "./visual.module.css";
import { api } from "../common/comon";
import VisualDetail from "./visualDetail";
import { getArtworks } from "@/common/comon";

const Visual = async () => {

    const { container, left, right } = styles;
    return (
        <div className={container}>
            <VisualDetail Artwork={(await getArtworks() || []).filter(({ visualYn }) => visualYn === 'Y')} />
        </div>
    );
};
export default Visual;