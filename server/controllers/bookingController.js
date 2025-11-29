import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

// Function to check availability of seats for a movie
const checkSeatAvailability = async (showId, selectedSeats) => {
    try {
        const show = await Show.findById(showId);
        if(!show){
            return false;
        }
        const isSeatAvailable = selectedSeats.some(seat => show.occupiedSeats[seat]);
        return !isSeatAvailable;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

// Create Booking API
export const createBooking = async (req, res) =>{
    try {
        const {userId} = req.auth(); 
        const {showId, selectedSeats} = req.body;
        const {origin} = req.headers;
        const isSeatsAvailable = await checkSeatAvailability(showId, selectedSeats);
        if(!isSeatsAvailable){
            return res.json({success: false, message: 'Selected seats are not available.'});
        }
        // Get show details
        const showData = await Show.findById(showId).populate('movie');

        //Create a new booking
        const booking  = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
        })
        selectedSeats.map(seat => {
            showData.occupiedSeats[seat] = userId;
        });
        showData.markModified('occupiedSeats');
        await showData.save();
        // Stripe Gatway Initialize
        res.json({success: true, message: 'Booking created successfully'});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}
// API to get occupied seats for a show
export const getOccupiedSeats = async (req, res) =>{
    try {   
        const {showId} = req.params;
        const show =  await Show.findById(showId);
        const occupiedSeats = Object.keys(show.occupiedSeats);
        res.json({success: true, occupiedSeats});
    }
    catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}