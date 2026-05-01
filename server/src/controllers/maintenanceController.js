const maintenanceService = require('../services/maintenanceService');

exports.createRequest = async (req, res) => {
  try {
    const requestId = await maintenanceService.createRequest(req.body, req.user.id);
    res.status(201).json({ message: 'Maintenance request created', requestId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await maintenanceService.getAllRequests(req.query, req.user);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await maintenanceService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const result = await maintenanceService.updateRequest(req.params.id, req.body, req.user);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }
    res.json({ message: 'Request updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.uploadPhotos = async (req, res) => {
  try {
    const type = req.query.type;
    const fieldName = type === 'before' ? 'before_photos' : 'after_photos';
    const files = (req.files && req.files[fieldName]) || [];

    const result = await maintenanceService.uploadPhotos(req.params.id, type, files, req.user);
    if (result.error) {
      return res.status(result.status).json({ message: result.error });
    }

    res.json({ message: 'Photos uploaded', [`${type}_photo_1`]: result.p1, [`${type}_photo_2`]: result.p2 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const rowCount = await maintenanceService.deleteRequest(req.params.id);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
