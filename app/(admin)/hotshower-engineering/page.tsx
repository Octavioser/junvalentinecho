import React, { useState } from 'react';
import { getArtworks } from "@/common/comon";
import ArtworkPage from './ArtworkPage';


export const metadata = { title: '개인작업실' };

const HotshowerEngineering = async () => {

    return (
        <></>
        // <ArtworkPage artworks={await getArtworks()} />
    );
};

export default HotshowerEngineering;
