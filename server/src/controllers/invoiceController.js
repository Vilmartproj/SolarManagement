const invoiceService = require('../services/invoiceService');

exports.createInvoice = async (req, res) => {
  try {
    const result = await invoiceService.createInvoice(req.body, req.user.id);
    res.status(201).json({ message: 'Invoice created', ...result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;
    const invoices = await invoiceService.getAllInvoices(status, search);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paid_date } = req.body;
    const rowCount = await invoiceService.updateInvoiceStatus(req.params.id, status, paid_date);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const rowCount = await invoiceService.deleteInvoice(req.params.id);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
