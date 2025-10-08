import { Metadata } from 'next';
import React, { useState } from 'react';
import SeasonDetail from "./SeasonDetail";


export async function generateMetadata({ params, }: { params: Promise<{ season: string; }>; }): Promise<Metadata> {
    const { season: param } = await params;
    return {
        title: param ? `${param}` : "Season",
    };
}
const Season = async ({ params, searchParams }: { params: Promise<{ season: string; }>, searchParams: Promise<{ id?: string; }>; }) => {

    const { season: param } = await params;

    const { id } = await searchParams;

    return (
        <SeasonDetail param={param} id={id} />
    );
};

export default Season;