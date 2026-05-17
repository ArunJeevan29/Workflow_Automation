const express = require('express');
const router = express.Router();
const { 
  login, 
  createStaff, 
  getUsers, 
  updateStaff, 
  deleteStaff, 
  changePassword
} = require('../controllers/authController');

router.post('/login', login);
router.post('/users', createStaff); 
router.get('/users', getUsers); 

router.put('/users/:id', updateStaff);
router.delete('/users/:id', deleteStaff);

router.put('/users/:id/password', changePassword);

module.exports = router;