
"use server"
import fs from 'fs';
import path from 'path';
import { Artwork } from "@/types";

// json데이터 가져오기 
export const getJsonData = async () => {

    const dataFilePath = path.join(process.cwd(), 'jsondata', 'movie.json');
    // JSON 파일 읽기
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');

    // JSON 데이터를 반환
    return JSON.parse(fileData);
}

export const updateJsonData = async (id: string, Artwork: Artwork) => {

    const dataFilePath = path.join(process.cwd(), 'jsondata', 'movie.json');
    // JSON 파일 읽기
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

    const updateData = jsonData.map((item: Artwork) => (item.id === id ? Artwork : item));

    fs.writeFileSync(dataFilePath, JSON.stringify(updateData, null, 2));

    return updateData;
}