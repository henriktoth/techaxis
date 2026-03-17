import { Request, Response } from 'express';
import { prisma } from '../config/db.config';

export const createComment = async (req: Request, res: Response) => {
  try {
    const { articleId, content } = req.body;
    const authorId = req.user?.userId;

    if (!authorId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        articleId: Number(articleId),
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
};

export const getCommentsByArticle = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        articleId: Number(articleId),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.comment.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};
