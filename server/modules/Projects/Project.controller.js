import { ProjectService } from "./Project.service.js";

const handleError = (res, error) => {
  console.error("Projects controller error:", error);
  const status = error.statusCode || 500;
  return res.status(status).json({ error: error.message || "Server error" });
};

export const createProject = async (req, res) => {
  try {
    const project = await ProjectService.createProject(req.user, req.body);
    return res.status(201).json(project);
  } catch (error) {
    return handleError(res, error);
  }
};

export const addMotorToProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const result = await ProjectService.addMotorToProject(
      req.user,
      projectId,
      req.body
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const approveProjectMotorUpdate = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const projectMotorId = parseInt(req.params.projectMotorId, 10);
    const result = await ProjectService.approveProjectMotor(
      req.user,
      projectId,
      projectMotorId
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const rejectProjectMotorUpdate = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const projectMotorId = parseInt(req.params.projectMotorId, 10);
    const result = await ProjectService.rejectProjectMotor(
      req.user,
      projectId,
      projectMotorId
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteMotorFromProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const projectMotorId = parseInt(req.params.projectMotorId, 10);
    const result = await ProjectService.deleteMotorFromProject(
      req.user,
      projectId,
      projectMotorId
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await ProjectService.getProjects(req.user);
    return res.status(200).json(projects);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getProjectById = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const project = await ProjectService.getProjectById(req.user, projectId);
    return res.status(200).json(project);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateProjectMeta = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const project = await ProjectService.updateProjectMeta(
      req.user,
      projectId,
      req.body
    );
    return res.status(200).json(project);
  } catch (error) {
    return handleError(res, error);
  }
};
