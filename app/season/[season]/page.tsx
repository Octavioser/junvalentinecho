import React, { useState } from 'react';
import { getArtworks } from "@/common/comon";
import SeasonDetail from "./SeasonDetail";


export const metadata = { title: 'season' };

const HotshowerEngineering = async ({ params, searchParams }: { params: Promise<{ season: string; }>, searchParams: Promise<{ id?: string; }>; }) => {

    const Artwork = await getArtworks();

    const { season: param } = await params;

    const { id } = await searchParams;

    return (
        <SeasonDetail artworks={(Artwork || []).filter(({ season }) => season === param)} id={id} />
    );
};

export default HotshowerEngineering;