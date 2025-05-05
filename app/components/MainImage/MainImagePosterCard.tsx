"use client"
import styles from "./MainImage.module.css";

const MainImagePosterCard = ({ children, onMouseMove, onMouseUp, onMouseLeave }: {
    children: React.ReactNode
    onMouseMove?: ((e: React.MouseEvent<HTMLDivElement>) => void) | null;
    onMouseUp?: (() => void) | null;
    onMouseLeave?: (() => void) | null;
}) => {


    return (
        <div
            className={styles.posterCard}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>
    )
}

export default MainImagePosterCard;