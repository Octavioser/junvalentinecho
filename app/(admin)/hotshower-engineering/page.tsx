import React, { useState } from 'react';
import { getJsonData, updateJsonData } from "../../../jsondata/jsonhandlers";
import ArtworkPage from './ArtworkPage';


export const metadata = { title: '개인작업실' }

const HotshowerEngineering = async () => {

    const data = await getJsonData();

    return (
        <ArtworkPage artworks={data} />
    )
}

export default HotshowerEngineering;
