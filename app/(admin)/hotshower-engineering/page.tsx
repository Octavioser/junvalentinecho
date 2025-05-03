import React, { useState } from 'react';
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';


export const metadata = { title: '개인작업실' }


const hotshowerEngineering = () => {



    return <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        {/* 내용 입력영역 */}
        <div style={{ backgroundColor: 'red', width: '50%' }}>
            21312
        </div>
        {/* 이미지 위치 영역 */}
        <div style={{ backgroundColor: 'yellow', width: '50%' }}>
            <ArtworkDisplayPanel />
        </div>
    </div>
}

export default hotshowerEngineering;
