import React, { useState } from 'react';
import { getJsonData, updateJsonData } from "@/common/Jsonhandlers";
import SeasonDetail from "./SeasonDetail";


export const metadata = { title: 'season' }

const HotshowerEngineering = async ({ params, searchParams }: { params: Promise<{ season: string }>, searchParams: Promise<{ id?: string }> }) => {

    const Artwork = await getJsonData();

    const { season: param } = await params;

    const { id } = await searchParams;

    return (
        <SeasonDetail artworks={(Artwork || []).filter(({ season }) => season === param)} id={id} />
    )
}

export default HotshowerEngineering;