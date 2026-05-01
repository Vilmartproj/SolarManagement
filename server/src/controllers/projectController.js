const projectService = require('../services/projectService');

exports.createProject = async (req, res) => {
  try {
    const projectId = await projectService.createProject(req.body, req.user.id);
    res.status(201).json({ message: 'Project created', projectId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const projects = await projectService.getAllProjects(status, search);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const rowCount = await projectService.updateProject(req.params.id, req.body);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const rowCount = await projectService.deleteProject(req.params.id);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await projectService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
