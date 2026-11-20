const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Все роуты бронирований требуют авторизации
router.use(authMiddleware);

router.get('/availability', reservationController.getClassroomAvailability);
router.post('/', reservationController.createReservation);
router.get('/my', reservationController.getMyReservations);
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;