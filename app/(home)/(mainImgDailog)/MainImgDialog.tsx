import styles from './MainImgDialog.module.css';
import { Fragment, useState, useEffect, useRef } from "react";
import { Artwork } from "@/types";

const MainImgDialog = ({ targetImg: { poster_path, title, width, height, material, year, overview }, dialogClose }:
    { targetImg: Artwork, dialogClose: () => void; }) => {

    const { dialogOverlay, dialogContainer, dialogImageContainer, dialogImage, dialogInfo, dialogInfoTitle, dialogInfoOverView } = styles;

    return <div className={dialogOverlay} onClick={() => { dialogClose(); }}>
        <div className={dialogContainer} onClick={e => e.stopPropagation()}>
            <div className={dialogImageContainer}>
                <img
                    className={dialogImage}
                    src={poster_path}
                    alt={title}
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                />
            </div>
            <div className={dialogInfo}>
                <span className={dialogInfoTitle}>{title}</span>
                <span>{year}</span>
                <span>{`${width} x ${height} cm`}</span>
                <span>{material}</span>
                <span className={dialogInfoOverView}>{overview}</span>
            </div>
        </div>
    </div>;
};
export default MainImgDialog;