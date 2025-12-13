import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = {
  SUPERVISOR: "admin", // maps to existing User.role values
  ENGINEER: "engineer",
  CUSTOMER: "customer",
};

// Helper: check if user is supervisor
const isSupervisor = (user) => user?.role === ROLES.SUPERVISOR;

// Helper: check if user is engineer
const isEngineer = (user) => user?.role === ROLES.ENGINEER;

// Helper: check if user is customer
const isCustomer = (user) => user?.role === ROLES.CUSTOMER;

// Visibility checks
const canViewProject = async (user, projectId) => {
  if (isSupervisor(user)) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      creatorId: true,
      customerId: true,
    },
  });

  if (!project) return false;

  if (isEngineer(user)) {
    // Engineers can see projects they created or where they have explicit permissions
    if (project.creatorId === user.id) return true;

    const perm = await prisma.projectUserPermission.findFirst({
      where: {
        projectId: projectId,
        userId: user.id,
      },
    });
    return !!perm;
  }

  if (isCustomer(user)) {
    // Customers can only see their own projects
    if (project.customerId === user.id || project.creatorId === user.id) {
      return true;
    }
  }

  return false;
};

const canEditProjectMeta = async (user, projectId) => {
  if (isSupervisor(user)) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      creatorId: true,
      customerId: true,
    },
  });

  if (!project) return false;

  if (isEngineer(user)) {
    // Engineers can edit projects they created or supervisor-created projects
    if (project.creatorId === user.id) return true;

    const perm = await prisma.projectUserPermission.findFirst({
      where: {
        projectId: projectId,
        userId: user.id,
        canEditMeta: true,
      },
    });
    return !!perm;
  }

  // Customers cannot edit
  return false;
};

export const ProjectService = {
  async createProject(user, data) {
    const { name, description, customerId } = data || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      const err = new Error("Project name is required");
      err.statusCode = 400;
      throw err;
    }

    const projectData = {
      name: name.trim(),
      description,
      creatorId: user.id,
    };

    if (isCustomer(user)) {
      projectData.customerId = user.id;
    } else if (isSupervisor(user) && customerId) {
      projectData.customerId = customerId;
    }

    try {
      const project = await prisma.project.create({
        data: projectData,
      });
      return project;
    } catch (error) {
      if (error.code === "P2002") {
        const metaTarget = error.meta?.target || [];
        if (metaTarget.includes("creatorId") && metaTarget.includes("name")) {
          const err = new Error("Project name must be unique per creator");
          err.statusCode = 409;
          throw err;
        }
      }
      throw error;
    }
  },

  async addMotorToProject(user, projectId, payload) {
    const { fanId, motorId, comment } = payload || {};

    if (!Number.isInteger(fanId) || !Number.isInteger(motorId)) {
      const err = new Error("fanId and motorId must be valid integers");
      err.statusCode = 400;
      throw err;
    }

    const canView = await canViewProject(user, projectId);
    if (!canView) {
      const err = new Error("Not authorized to access this project");
      err.statusCode = 403;
      throw err;
    }

    // Ensure referenced fan and motor exist for safer UX
    const [fan, motor] = await Promise.all([
      prisma.fanData.findUnique({ where: { id: fanId } }),
      prisma.motorData.findUnique({ where: { id: motorId } }),
    ]);

    if (!fan) {
      const err = new Error("Selected fan does not exist");
      err.statusCode = 400;
      throw err;
    }

    if (!motor) {
      const err = new Error("Selected motor does not exist");
      err.statusCode = 400;
      throw err;
    }

    const actionStatus = isSupervisor(user) ? "APPROVED" : "PENDING";
    const isActive = isSupervisor(user);

    const projectMotor = await prisma.projectMotor.create({
      data: {
        projectId,
        fanId,
        motorId,
        action: "ADD",
        status: actionStatus,
        isActive,
        requestedById: user.id,
        approvedById: isSupervisor(user) ? user.id : null,
        comment,
        decidedAt: isSupervisor(user) ? new Date() : null,
      },
    });

    return projectMotor;
  },

  async approveProjectMotor(user, projectId, projectMotorId) {
    if (!isSupervisor(user)) {
      const err = new Error("Only supervisors can approve updates");
      err.statusCode = 403;
      throw err;
    }

    const update = await prisma.projectMotor.findFirst({
      where: {
        id: projectMotorId,
        projectId,
      },
    });

    if (!update) {
      const err = new Error("Update not found");
      err.statusCode = 404;
      throw err;
    }

    if (update.status !== "PENDING") {
      const err = new Error("Only pending updates can be approved");
      err.statusCode = 400;
      throw err;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectMotor.update({
        where: { id: update.id },
        data: {
          status: "APPROVED",
          approvedById: user.id,
          decidedAt: new Date(),
          isActive: update.action === "ADD",
        },
      });

      if (update.action === "DELETE") {
        await tx.projectMotor.updateMany({
          where: {
            projectId,
            fanId: update.fanId,
            motorId: update.motorId,
            status: "APPROVED",
            action: "ADD",
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      return updated;
    });

    return result;
  },

  async rejectProjectMotor(user, projectId, projectMotorId) {
    if (!isSupervisor(user)) {
      const err = new Error("Only supervisors can reject updates");
      err.statusCode = 403;
      throw err;
    }

    const update = await prisma.projectMotor.findFirst({
      where: {
        id: projectMotorId,
        projectId,
      },
    });

    if (!update) {
      const err = new Error("Update not found");
      err.statusCode = 404;
      throw err;
    }

    if (update.status !== "PENDING") {
      const err = new Error("Only pending updates can be rejected");
      err.statusCode = 400;
      throw err;
    }

    const updated = await prisma.projectMotor.update({
      where: { id: projectMotorId },
      data: {
        status: "REJECTED",
        approvedById: user.id,
        decidedAt: new Date(),
      },
    });

    return updated;
  },

  async deleteMotorFromProject(user, projectId, projectMotorId) {
    if (!isSupervisor(user)) {
      const err = new Error(
        "Only supervisors can delete motors from a project"
      );
      err.statusCode = 403;
      throw err;
    }

    const active = await prisma.projectMotor.findFirst({
      where: {
        id: projectMotorId,
        projectId,
        status: "APPROVED",
        action: "ADD",
        isActive: true,
      },
    });

    if (!active) {
      const err = new Error("Active motor association not found");
      err.statusCode = 404;
      throw err;
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleteUpdate = await tx.projectMotor.create({
        data: {
          projectId,
          fanId: active.fanId,
          motorId: active.motorId,
          action: "DELETE",
          status: "APPROVED",
          isActive: false,
          requestedById: user.id,
          approvedById: user.id,
          comment: "Deleted by supervisor",
          decidedAt: new Date(),
        },
      });

      await tx.projectMotor.update({
        where: { id: active.id },
        data: { isActive: false },
      });

      return deleteUpdate;
    });

    return result;
  },

  async getProjects(user) {
    if (isSupervisor(user)) {
      return prisma.project.findMany({
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          motors: true,
          permissions: true,
        },
      });
    }

    if (isEngineer(user)) {
      return prisma.project.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            {
              permissions: {
                some: { userId: user.id },
              },
            },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          motors: true,
          permissions: true,
        },
      });
    }

    if (isCustomer(user)) {
      return prisma.project.findMany({
        where: {
          OR: [{ customerId: user.id }, { creatorId: user.id }],
        },
      });
    }

    return [];
  },

  async getProjectById(user, projectId) {
    if (!Number.isInteger(projectId)) {
      const err = new Error("Project id must be an integer");
      err.statusCode = 400;
      throw err;
    }

    const canView = await canViewProject(user, projectId);
    if (!canView) {
      const err = new Error("Not authorized to access this project");
      err.statusCode = 403;
      throw err;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        motors: true,
        permissions: true,
      },
    });

    if (!project) {
      const err = new Error("Project not found");
      err.statusCode = 404;
      throw err;
    }

    return project;
  },

  async updateProjectMeta(user, projectId, data) {
    const canEdit = await canEditProjectMeta(user, projectId);
    if (!canEdit) {
      const err = new Error("Not authorized to edit this project");
      err.statusCode = 403;
      throw err;
    }

    const allowedFields = {};
    if (typeof data.name === "string") allowedFields.name = data.name;
    if (typeof data.description === "string")
      allowedFields.description = data.description;
    if (typeof data.status === "string") allowedFields.status = data.status;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: allowedFields,
    });

    return project;
  },
};
