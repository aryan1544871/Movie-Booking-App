import express from 'express';
import { createBooking ,getOccupiedSeats} from '../controllers/bookingController.js';
const bookingRouter = express.Router();

// Define booking routes here

bookingRouter.post('/create', createBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;