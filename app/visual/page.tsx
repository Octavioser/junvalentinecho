import styles from "./visual.module.css";
import VisualDetail from "./visualDetail";

export const metadata = { title: 'Visual' };

const Visual = async () => {

    const { container, left, right } = styles;
    return (
        <div className={container}>
            <VisualDetail />
        </div>
    );
};
export default Visual;