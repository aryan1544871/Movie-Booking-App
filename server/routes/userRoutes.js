import express from 'express';
import { getUserBookings, updateFavorite, getFavoriteMovies } from '../controllers/userController.js';

const userRouter = express.Router();

// Define user routes here  

userRouter.get('/bookings', getUserBookings);
userRouter.post('/update-favorite', updateFavorite);
userRouter.get('/favorites', getFavoriteMovies);

export default userRouter;