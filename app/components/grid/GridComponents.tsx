"use client"
import React, { useState } from "react";
import { Artwork, ArtworkList } from "@/types";



const GridComponents = ({ columnList, artworks, selectedArtworkId, setSelectedArtworkId }: { columnList: any[], artworks: ArtworkList, selectedArtworkId: String, setSelectedArtworkId: React.Dispatch<React.SetStateAction<String>> }) => {

    return (
        <div
            style={{
                position: 'relative',
                backgroundColor: '#FAFAFA',
                width: '99.5%',
                height: '83%',
                borderRight: '2px solid #E1E1E1',
                borderLeft: '2px solid #E1E1E1',
                borderBottom: '2px solid #E1E1E1',
                borderTop: '2px solid black',
                fontSize: '0.7rem',
                overflow: 'auto'
            }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F4F4F4' }}>
                    <tr>
                        {columnList.map(({ header }, index) =>
                            <th key={'cth' + (index + 1)} style={{ border: '2px solid #E8E8E8' }}>{header}</th>
                        )}
                    </tr>
                </thead>
                <tbody style={{ backgroundColor: 'white' }}>
                    {artworks.map((data, index) =>
                        <tr key={`tbodyTr${index}`} >
                            {columnList.map(({ name: colName, header, type }, index) =>
                                <td key={'text' + colName + index}
                                    style={{ border: '2px solid #E8E8E8', backgroundColor: selectedArtworkId === data.id ? '#adc9e2' : 'white', cursor: 'pointer' }}
                                    onClick={() => { setSelectedArtworkId(data.id) }}
                                >
                                    <>{data[colName]}</>
                                </td>
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default GridComponents;