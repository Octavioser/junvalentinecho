import Image from "next/image";
import styles from "./video.module.css";
import VimeoPlayer from "@/components/VimeoPlayer/VimeoPlayer";
import { ARTWORK_QUALITY } from "@/common/image";
import sheet from "./me-and-eddies.webp";

export const metadata = { title: 'VIDEO' };

const VIMEO_ID = 1250732362; // https://vimeo.com/1250732362
const TITLE = 'Me & Eddies (Thermal Archives) (2023)';

// video 화면: 위에 영상, 그 아래 왼쪽에 장면 모음 사진, 오른쪽에 제목(크게)과 설명.
// 세로 화면(모바일)도 같은 배치 (사진과 제목·설명이 같은 줄)
const Video = () =>
    <div className={styles.container}>
        <div className={styles.scroll}>
            <div className={styles.inner}>
                <VimeoPlayer videoId={VIMEO_ID} title={TITLE} />
                <div className={styles.info}>
                    <div className={styles.sheet}>
                        {/* 사진 파일을 코드에서 직접 불러와서(import) 크기를 Next가 알고 있음 → 뜨는 동안 자리가 밀리지 않음.
                            sizes: 사진이 화면에 그려지는 너비 = 내용 폭의 절반 (video.module.css의 .inner 폭 계산과 같은 식).
                            화면에 그려지는 너비에 맞는 사본을 받음 */}
                        <Image
                            src={sheet}
                            alt={`${TITLE} 영상의 장면 모음`}
                            sizes="(max-aspect-ratio: 1/1) 46vw, max(160px, min(520px, 50vw - 78px, 50.4vh - 83px))"
                            quality={ARTWORK_QUALITY}
                            draggable={false}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                    <div className={styles.text}>
                        <span className={styles.title}>{TITLE}</span>
                        <span className={styles.description}>
                            A video based on an essay I wrote- [Me &amp; Eddies], where I have researched the physical and spiritual meaning of the corner. All images, videos, and music produced by me.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>;

export default Video;
