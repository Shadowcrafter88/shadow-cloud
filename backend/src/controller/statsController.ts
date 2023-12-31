import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import "dotenv/config";

interface ITimeSeriesData {
  date: string;  // formatted as YYYY-MM-DD
  count: number;
}

interface IAdminStats {
  userCount: number;
  uploadCount: number;
  fileCount: number;
  viewCount: number;
  totalSize: number;
  userflow: ITimeSeriesData[];
  uploadflow: ITimeSeriesData[];
}

const prisma = new PrismaClient();

export const getStats = async (req: Request, res: Response) => {
  // @ts-ignore
  if (req.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const userCount = await prisma.user.count();
    const uploadCount = await prisma.upload.count();
    const fileCount = await prisma.file.count();

    // Sum all views of all uploads
    const viewCount = (await prisma.upload.aggregate({
      _sum: {
        views: true,
      },
    }))._sum.views;

    if (!viewCount) return res.status(500).json({ error: "Failed to fetch stats" });

    // Sum all sizes of all files
    const totalSize = ((await prisma.file.aggregate({
      _sum: {
        size: true,
      },
    }))._sum.size ?? 0);

    if (!totalSize) return res.status(500).json({ error: "Failed to fetch stats" });

    const userflow: ITimeSeriesData[] = [];
    const uploadflow: ITimeSeriesData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0];

      const nextDay = new Date(new Date(formattedDate).getTime());
      nextDay.setDate(nextDay.getDate() + 1);

      const userCountOnDate = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(formattedDate),
            lt: nextDay
          },
        },
      });

      const uploadCountOnDate = await prisma.upload.count({
        where: {
          createdAt: {
            gte: new Date(formattedDate),
            lt: nextDay
          },
        },
      });

      userflow.push({ date: formattedDate, count: userCountOnDate });
      uploadflow.push({ date: formattedDate, count: uploadCountOnDate });
    }  

    const stats: IAdminStats = {
      userCount,
      uploadCount,
      fileCount,
      viewCount,
      totalSize,
      userflow,
      uploadflow,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export default {
  getStats,
};
