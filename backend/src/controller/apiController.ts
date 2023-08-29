import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import path from "path";
import deleteUploadHelper from "../helper/deleteUpload";

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
    const dirPath = path.relative("./uploads", path.dirname(files[0].path));

    // Create new upload in database
    const upload = await prisma.upload.create({
      data: {
        userId: currentUser.id,
        name: name,
        path: dirPath,
      },
    });

    // Create files in database
    const filesToCreate = files.map((file) => {
      return {
        uploadId: upload.id as number,
        name: file.originalname as string,
        type: file.mimetype as string,
        size: file.size as number,
      };
    });

    await prisma.file.createMany({
      data: filesToCreate,
    });

    return res.status(200).json({
      message: "Files uploaded successfully",
      location: dirPath,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong while uploading files" });
  }
};

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
      },
    });

    return res.status(200).json(uploads);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching files" });
  }
};

export const getUpload = async (req: Request, res: Response) => {
  try {
    const user = req.params.user as string;
    const id = req.params.id as string;

    console.log(user, id);

    // Get and add to view count
    const upload = await prisma.upload.update({
        where: {
          path: user + "\\" + id,
        },
        data: {
          views: {
            increment: 1
          }
        },
        include: {
          files: true,
        },
    });

    if (!upload) return res.status(404).json({ error: "Upload not found" });

    return res.status(200).json(upload);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching files" });
  }
};

export const deleteUpload = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUser = req.user as User;
    const uploadId = parseInt(req.params.id);

    // Check if user is owner of upload
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        userId: currentUser.id,
      },
    });

    if (!upload) return res.status(404).json({ error: "Upload not found" });

    deleteUploadHelper(uploadId);

    return res.status(200).json({ message: "Upload deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong while deleting" });
  }
};

export const getDownload = async (req: Request, res: Response) => {
  try {
    const uploadUser = req.params.uploadUser as string;
    const uploadId = req.params.uploadId as string;
    const fileId = parseInt(req.params.fileId);

    // Get upload from database
    const upload = await prisma.upload.update({
      where: {
        path: uploadUser + "\\" + uploadId,
      },
      data: {
        downloadCount: {
          increment: 1
        }
      },
      include: {
        files: true,
      },
    });

    if (!upload) return res.status(404).json({ error: "Upload not found" });

    const file = upload.files.find((file) => file.id === fileId);

    if (!file) return res.status(404).json({ error: "File not found" });

    // Send file to client
    return res.download(
      path.join(__dirname, "..", "..", "uploads", upload.path, file.name),
      file.name
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong while downloading" });
  }
};

export default {
  postUpload,
  getUploads,
  getUpload,
  deleteUpload,
  getDownload,
};
