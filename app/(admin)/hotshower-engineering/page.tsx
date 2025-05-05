import React, { useState } from 'react';

import ArtworkPage from './ArtworkPage';


export const metadata = { title: '개인작업실' }

import fs from 'fs';
import path from 'path';

const HotshowerEngineering = () => {

    const fileData = fs.readFileSync(path.join(process.cwd(), 'jsondata', 'movie.json'), 'utf-8');
    const data = JSON.parse(fileData);

    return (
        <ArtworkPage artworks={data} />
    )
}

export default HotshowerEngineering;
