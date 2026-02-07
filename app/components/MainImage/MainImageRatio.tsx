"use client";
import styles from "./MainImage.module.css";


const MainImageRatio = ({ label }: { label: string; }) => {

    const { posterRatio } = styles;

    return <div className={posterRatio}>
        <span>{label}</span>
        <span
            style={{
                marginLeft: "3px",
                width: "53px",
                height: "6px",
                borderStyle: "solid",
                borderColor: "rgb(0, 0, 0)",
                borderImage: "initial",
                borderWidth: "0px 2px 2px",
                boxSizing: "border-box",
                transition: "width 0.2s ease-in-out",
            }}
        ></span>
    </div>;

};
export default MainImageRatio;