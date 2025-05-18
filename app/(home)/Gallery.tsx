"use client"

import styles from "./home.module.css"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import Detaildialog from "./detaildialog/Detaildialog";
import MainImagePosterCard from "../components/MainImage/MainImagePosterCard";
import ImageStyle from "../components/MainImage/MainImage.module.css";
import { Artwork, ArtworkList } from "@/types";


const Gallery = ({ artworks }: { artworks: ArtworkList }) => {

    const [id, setId] = useState<string>('');

    const scrollRef = useRef<HTMLDivElement>(null); // Ref 생성

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // 기본 수직 스크롤 방지
            scrollContainer.scrollLeft += e.deltaY; // 수직 휠 움직임을 가로 스크롤로 변환
        };

        // 이벤트 리스너 추가
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // 중복된 galleryId를 가진 Artwork 객체를 제거
    const groupIdList = Array.from(new Map(artworks.map(item => [item.galleryId, item])).values()) || [];


    const galleryList = artworks.reduce((acc: { [key: string]: ArtworkList }, cur: Artwork) => {
        const key = `${cur.galleryId}`;
        if (acc[key]) return { ...acc, [key]: acc[key].concat([cur]) };
        return { ...acc, [key]: [cur] };
    }, {})

    const { scrollContainer, posterTrack, posterCardFrame } = styles;

    return (
        <>
            <div className={scrollContainer} ref={scrollRef} onClick={() => { id && setId('') }}>
                {groupIdList.map(({ id, galleryId }) =>
                    <div key={id} className={posterTrack}>
                        <div className={posterCardFrame}>
                            <MainImagePosterCard>
                                {(galleryList[galleryId] || []).map(({ title, id, poster_path, top, width, left, zIndex }, index) =>
                                    <img key={`gallery${index}`}
                                        className={ImageStyle.metalFrame}
                                        style={{ top: `${top}%`, width: `${width}%`, left: `${left}%`, zIndex }}
                                        src={poster_path}
                                        alt={title}
                                        onClick={() => { setId(id) }}>
                                    </img>
                                )}
                            </MainImagePosterCard>
                        </div>
                    </div>
                )}
            </div>
            {id && <Detaildialog id={id} artworks={artworks} />}
        </>
    )
}
export default Gallery;