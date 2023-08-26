import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import path from 'path';


const prisma = new PrismaClient();

export const postUpload = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const currentUser = req.user as User;

        // @ts-ignore
        const files = req.files as Express.Multer.File[];
        console.log(files);
        const name = req.body.name;

        if (!name) return res.status(400).json({ error: "No name provided" });

        // Generate directory path
        const dirPath = path.relative('./uploads', path.dirname(files[0].path));
        
        // Create new upload in database
        const upload = await prisma.upload.create({
            data: {
                userId: currentUser.id,
                name: name,
                path: dirPath,
            }
        });

        // Create files in database
        const filesToCreate = files.map(file => {
            return {
                uploadId: upload.id as number,
                name: file.originalname as string,
                space: file.size as number,
            }
        });

        const createdFiles = await prisma.file.createMany({
            data: filesToCreate,
        });

        return res.status(200).json({ 
            message: "Files uploaded successfully",
            location: dirPath });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Something went wrong while uploading files" });
    }
}

export const getUploads = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const currentUser = req.user as User;

        const uploads = await prisma.upload.findMany({
            where: {
                userId: currentUser.id,
            },
            include: {
                files: true,
            }
        });

        return res.status(200).json(uploads);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Something went wrong while fetching files" });
    }
}

export default {
    postUpload,
    getUploads
}