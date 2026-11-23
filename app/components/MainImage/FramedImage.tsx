"use client";

import { Ref, useRef, useState } from "react";
import Image, { ImageProps } from "next/image";
import styles from "./MainImage.module.css";
import { hasTransparency } from "@/common/image";

// 전시창에 거는 그림: 얇은 금속 액자와 그림자를 두름.
// 배경을 잘라낸 그림(투명한 곳이 있는 그림)은 네모난 액자 대신 그림 모양을 따라 그림자만 짐
const FramedImage = ({ className, onLoad, ...props }: ImageProps & { ref?: Ref<HTMLImageElement | null>; }) => {
    const [cutout, setCutout] = useState(false);
    const checked = useRef(false);

    return (
        <Image
            {...props}
            className={[styles.metalFrame, cutout ? styles.cutout : '', className ?? ''].join(' ')}
            onLoad={(e) => {
                // 투명한 곳이 있는지는 처음 뜬 그림으로 한 번만 확인. 같은 그림의 더 큰 사본·원본으로 바뀔 때 또 확인하면
                // 수천 픽셀짜리 원본을 통째로 풀어야 해서 화면이 잠깐 멈춤 (결과는 같음)
                if (!checked.current) {
                    checked.current = true;
                    setCutout(hasTransparency(e.currentTarget));
                }
                onLoad?.(e);
            }}
        />
    );
};

export default FramedImage;
