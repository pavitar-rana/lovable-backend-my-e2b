import { prisma } from "../lib/prisma.ts";

export const UserValidatorSocket = async (userId, io) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    io.to(userId).emit("user:error", { message: "User Not found" });
    return;
  }
  return user;
};

export const UserValidatorHttp = async (userId, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return user;
};

export const ProjectValidatorSocket = async (userId, projectId, io) => {
  const project = await prisma.project.findUnique({
    where: {
      userId,
      id: projectId,
    },
  });

  if (!project) {
    io.to(userId).emit("project:error", { message: "Create Project First" });
    return;
  }

  return project;
};

export const ProjectValidatorHttp = async (userId, projectId, res) => {
  const project = await prisma.project.findUnique({
    where: {
      userId,
      id: projectId,
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }
  return project;
};
