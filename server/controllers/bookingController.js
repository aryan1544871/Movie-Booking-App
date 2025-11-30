import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import stripe from 'stripe';

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
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        //Creating line items for Stripe
        const line_items = [{
            price_data:{
                currency: 'usd',
                product_data: {
                    name : showData.movie.title,
                },
                unit_amount:Math.floor(booking.amount) * 100
            },
            quantity: 1,
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url:`${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes expiration
        })

        booking.paymentLink = session.url;
        await booking.save();

        res.json({success: true, url: session.url});
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