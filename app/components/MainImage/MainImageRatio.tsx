"use client";
import styles from "./MainImage.module.css";
import { formatLength } from "@/common/format";

const BAR_RATIO = 0.1; // 막대 길이 = 카드 한 변의 10%

// 지도 축척과 같은 눈금 막대: 옆 숫자가 이 막대만큼의 실제 길이.
// cardCm = 카드 한 변이 지금 보여주는 실제 길이 (전시창 크기 ÷ 확대 배율). 카드 너비만큼의 요소 안에 넣어야 막대 %가 맞음
const MainImageRatio = ({ cardCm }: { cardCm: number; }) => {

    const { posterRatio } = styles;

    // 100cm 미만은 소수 첫째 자리까지 (반올림 때문에 막대와 숫자가 어긋나지 않게)
    const length = cardCm * BAR_RATIO;
    const label = formatLength(length < 100 ? Math.round(length * 10) / 10 : Math.round(length));

    return <div className={posterRatio}>
        <span>{`${label}cm`}</span>
        <span
            style={{
                marginLeft: "3px",
                width: `${BAR_RATIO * 100}%`,
                flexShrink: 0,
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
