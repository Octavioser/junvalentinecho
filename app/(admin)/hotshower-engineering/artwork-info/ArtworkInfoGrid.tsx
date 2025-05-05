"use client"
import React, { useState } from "react";
import { Artwork, ArtworkList } from "@/types";

const ArtworkInfoGrid = ({ artworks, selectedArtwork, setSelectedArtwork }: { artworks: ArtworkList, selectedArtwork: Artwork, setSelectedArtwork: React.Dispatch<React.SetStateAction<Artwork>> }) => {

    const columnList = [
        { name: 'id', header: 'ID', type: 'string' },
        { name: 'title', header: '제목', type: 'string' },
        { name: 'size', header: '사이즈', type: 'number' },
        { name: 'overview', header: '내용', type: 'string' }
    ]


    return (
        <div
            style={{
                position: 'relative',
                backgroundColor: '#FAFAFA',
                width: '100%',
                height: '83%',
                borderRight: '2px solid #E1E1E1',
                borderLeft: '2px solid #E1E1E1',
                borderBottom: '2px solid #E1E1E1',
                borderTop: '2px solid black',
                fontSize: '1rem',
                overflow: 'auto'
            }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F4F4F4' }}>
                    <tr>
                        {columnList
                            .map(({ header }, index) =>
                                <th key={'cth' + (index + 1)} style={{ border: '2px solid #E8E8E8' }}>{header}</th>
                            )}
                    </tr>
                </thead>
                <tbody style={{ backgroundColor: 'white' }}>
                    {artworks.map((data, index) =>
                        <tr key={`tbodyTr${index}`} >
                            {columnList
                                .map(({ name: colName, header, type }, index) =>
                                    <td key={'text' + colName + index}
                                        style={{ border: '2px solid #E8E8E8', backgroundColor: selectedArtwork?.id === data.id ? '#adc9e2' : 'white', cursor: 'pointer' }}
                                        onClick={() => { setSelectedArtwork(data) }}
                                    >
                                        <>{data[colName]}</>
                                    </td>
                                )
                            }
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
export default ArtworkInfoGrid;