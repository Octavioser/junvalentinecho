"use client";

import { Ref, useState } from "react";
import Image, { ImageProps } from "next/image";
import styles from "./MainImage.module.css";
import { hasTransparency } from "@/common/image";

// 전시창에 거는 그림: 얇은 금속 액자와 그림자를 두름.
// 배경을 잘라낸 그림(투명한 곳이 있는 그림)은 네모난 액자 대신 그림 모양을 따라 그림자만 짐
const FramedImage = ({ className, onLoad, ...props }: ImageProps & { ref?: Ref<HTMLImageElement | null>; }) => {
    const [cutout, setCutout] = useState(false);

    return (
        <Image
            {...props}
            className={[styles.metalFrame, cutout ? styles.cutout : '', className ?? ''].join(' ')}
            onLoad={(e) => {
                setCutout(hasTransparency(e.currentTarget));
                onLoad?.(e);
            }}
        />
    );
};

export default FramedImage;
