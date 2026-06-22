const express = require('express');
const router = express.Router();
const faceController = require('../controller/faceController');

// Placeholder authentication middleware - replace with your project's JWT check
const verifyToken = (req, res, next) => next(); 

// Enroll descriptors for an employee
router.post('/enroll', verifyToken, faceController.enroll);

// Recognize a single descriptor and match employee
router.post('/recognize', verifyToken, faceController.recognize);

// List enrolled employees
router.get('/list', verifyToken, faceController.list);

module.exports = router;
