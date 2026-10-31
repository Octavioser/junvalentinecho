import styles from "./visual.module.css";
import VisualDetail from "./visualDetail";

export const metadata = { title: '2D' };

const Visual = async () => {

    const { container, left, right } = styles;
    return (
        <div className={container}>
            <VisualDetail />
        </div>
    );
};
export default Visual;