"use client";

import { Ref, useRef, useState } from "react";
import Image, { ImageProps } from "next/image";
import styles from "./MainImage.module.css";
import { hasTransparency } from "@/common/image";

// 전시창에 거는 그림: 테두리 없이 그림자만 줌 (예전에는 얇은 회색 금속 액자 테두리가 있었음).
// 배경을 잘라낸 그림(투명한 곳이 있는 그림)은 네모난 그림자 대신 그림 모양을 따라 그림자가 짐
const FramedImage = ({ className, onLoad, ...props }: ImageProps & { ref?: Ref<HTMLImageElement | null>; }) => {
    const [cutout, setCutout] = useState(false);
    const checkedSrc = useRef<string | null>(null); // 투명한 곳을 확인한 그림 파일 (src)

    // src는 올린 원본 파일 주소: 사본으로 보여 주든 원본으로 보여 주든 같은 파일이면 같은 값
    const src = typeof props.src === 'string' ? props.src : 'static';

    return (
        <Image
            {...props}
            className={[styles.metalFrame, cutout ? styles.cutout : '', className ?? ''].join(' ')}
            onLoad={(e) => {
                // 투명한 곳이 있는지는 그림 파일마다 처음 뜬 그림으로 한 번만 확인. 같은 그림의 더 큰 사본·원본으로 바뀔 때 또 확인하면
                // 수천 픽셀짜리 원본을 통째로 풀어야 해서 화면이 잠깐 멈춤 (결과는 같음). 그림 파일 자체를 바꿨으면 다시 확인
                if (checkedSrc.current !== src) {
                    checkedSrc.current = src;
                    setCutout(hasTransparency(e.currentTarget));
                }
                onLoad?.(e);
            }}
        />
    );
};

export default FramedImage;
