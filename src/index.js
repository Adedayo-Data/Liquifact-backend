/**
 * LiquiFact API Gateway
 * Express server bootstrap for invoice financing, auth, and Stellar integration.
 */

const express = require('express');
const cors = require('cors');
const AppError = require('./errors/AppError');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./errors/AppError');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();
const { globalLimiter, sensitiveLimiter } = require('./middleware/rateLimit');
const { authenticateToken } = require('./middleware/auth');

const asyncHandler = require('./utils/asyncHandler');
const errorHandler = require('./middleware/errorHandler');
const { callSorobanContract } = require('./services/soroban');

const PORT = process.env.PORT || 3001;

/**
 * Global Middlewares
 */
app.use(cors());
app.use(express.json());

// In-memory storage for invoices (Issue #25)
let invoices = [];

/**
 * Health check endpoint.
 * Returns the current status and version of the service.
 * 
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'liquifact-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API information endpoint.
 * Lists available endpoints and service description.
 * 
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
app.get('/api', (req, res) => {
  return res.json({
    name: 'LiquiFact API',
    description: 'Global Invoice Liquidity Network on Stellar',
    endpoints: {
      health: 'GET /health',
      invoices: 'GET/POST /api/invoices',
      escrow: 'GET/POST /api/escrow',
    },
  });
});

// Example route using AppError
app.get('/api/invoices', (req, res, next) => {
  // Simulating an error scenario where the service is not ready
  return next(
    new AppError({
      type: 'https://liquifact.com/probs/service-not-implemented',
      title: 'Service Not Implemented',
      status: 501,
      detail: 'The invoice service is currently under development.',
      instance: req.originalUrl,
    })
  );
});

/**
 * Uploads and tokenizes a new invoice.
 * Generates a unique ID and sets the creation timestamp.
 * 
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
app.post('/api/invoices', (req, res) => {
  const { amount, customer } = req.body;
  
  if (!amount || !customer) {
    return res.status(400).json({ error: 'Amount and customer are required' });
  }

  const newInvoice = {
    id: `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    amount,
    customer,
    status: 'pending_verification',
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };

  invoices.push(newInvoice);

  return res.status(201).json({
    data: newInvoice,
    message: 'Invoice uploaded successfully.',
  });
});

/**
 * Performs a soft delete on an invoice.
 * Sets the deletedAt timestamp instead of removing the record.
 * 
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const invoiceIndex = invoices.findIndex(inv => inv.id === id);

  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // eslint-disable-next-line security/detect-object-injection
  if (invoices[invoiceIndex].deletedAt) {
    return res.status(400).json({ error: 'Invoice is already deleted' });
  }

  // eslint-disable-next-line security/detect-object-injection
  invoices[invoiceIndex].deletedAt = new Date().toISOString();

  return res.json({
    message: 'Invoice soft-deleted successfully.',
    // eslint-disable-next-line security/detect-object-injection
    data: invoices[invoiceIndex],
  });
});

app.post('/api/invoices', (req, res, next) => {
  const { amount } = req.body;
  if (!amount) {
    // Example: Validation error following RFC 7807
    return next(
      new AppError({
        type: 'https://liquifact.com/probs/invalid-request',
        title: 'Validation Error',
        status: 400,
        detail: "The 'amount' field is required for invoice creation.",
        instance: req.originalUrl,
      })
    );
  }
  res.status(201).json({
    data: { id: 'placeholder', status: 'pending_verification' },
    message: 'Invoice upload will be implemented with verification and tokenization.',
  });
});

/**
 * Retrieves escrow state for a specific invoice.
 * Robust integration wrapper for Soroban contract interaction.
 * 
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
app.get('/api/escrow/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  try {
    /**
     * Simulated remote contract call.
     * 
     * @returns {Promise<Object>} The escrow data.
     */
    const operation = async () => {
      return { invoiceId, status: 'not_found', fundedAmount: 0 };
    };

    const data = await callSorobanContract(operation);
    
    res.json({
      data,
      message: 'Escrow state read from Soroban contract via robust integration wrapper.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error fetching escrow state' });
  }
});

// Handle 404
app.use((req, res, next) => {
  next(
    new AppError({
      type: 'https://liquifact.com/probs/not-found',
      title: 'Resource Not Found',
      status: 404,
      detail: `The path ${req.path} does not exist.`,
      instance: req.originalUrl,
    })
  );
});

// Centralized Global Error Handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LiquiFact API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
