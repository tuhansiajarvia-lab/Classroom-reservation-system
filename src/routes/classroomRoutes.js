const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middlewares/authMiddleware');

function requireAdmin(req, res, next) {
  const role = String(req.session?.user?.rooli || req.session?.user?.role || '').toLowerCase();
  if (['admin', 'ylläpitäjä', 'yllapitaja'].includes(role)) {
    return next();
  }
  return res.status(403).json({
    message: 'Vain ylläpitäjällä on oikeus hallita luokkahuoneita'
  });
}

router.get('/', authMiddleware, classroomController.getAllClassrooms);
router.post('/', authMiddleware, requireAdmin, classroomController.createClassroom);
router.delete('/:id', authMiddleware, requireAdmin, classroomController.deleteClassroom);

module.exports = router;