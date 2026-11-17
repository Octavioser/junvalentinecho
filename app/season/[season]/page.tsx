import { Metadata } from 'next';
import React, { useState } from 'react';
import SeasonDetail from "./SeasonDetail";

// 주소로 들어온 시즌 이름은 한글·띄어쓰기가 %EC%8B%9C… 처럼 바뀐 채로 오므로 원래 글자로 되돌림 (안 그러면 작품의 시즌과 같지 않아 아무것도 안 나옴)
const decodeSeason = (value: string) => {
    try { return decodeURIComponent(value); } catch { return value; }
};

export async function generateMetadata({ params, }: { params: Promise<{ season: string; }>; }): Promise<Metadata> {
    const param = decodeSeason((await params).season);
    return {
        title: param ? `${param}` : "Season",
    };
}
const Season = async ({ params, searchParams }: { params: Promise<{ season: string; }>, searchParams: Promise<{ id?: string; }>; }) => {

    const param = decodeSeason((await params).season);

    const { id } = await searchParams;

    return (
        <SeasonDetail param={param} id={id ?? null} />
    );
};

export default Season;
