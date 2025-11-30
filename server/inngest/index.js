import { Inngest } from "inngest";
import User from '../models/User.js';
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import axios from 'axios';

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Ingest function to save user data to database

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
   const {id, first_name, last_name, email_addresses, image_url} = event.data;
   const userData = {
    _id:id,
    email: email_addresses[0].email_address,
    name: first_name+ ' '+ last_name,
    image: image_url
   }
   await User.create(userData);
  }, 
);


//Ingest function to delete  user data from database

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
   const {id} = event.data;
   await User.findByIdAndDelete(id);
  }, 
);

//Ingest function to update user data from database

const updateUserCreation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const {id, first_name, last_name, email_addresses, image_url} = event.data;
    const userData = {
        _id:id,
        email: email_addresses[0].email_address,
        name: first_name+ ' '+ last_name,
        image: image_url
    }
   await User.findByIdAndUpdate(id,userData);
  }, 
);
// Ingest function to cancel booking and release seats of show after 10 mins of booking created if payment is not made

const releaseSeatsAndDeleteBooking = inngest.createFunction(
{id: 'release-seats-delete-booking'},
{event: "app/checkpayment"},
async({event,step})=>{
  const tenMinutesLater = new Date (Date.now()+ 10*60*1000);
  await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);
  await step.run('check-payment-status', async()=>{
    const bookingId = event.data.bookingId;
    const booking = await Booking.findById(bookingId);

    //If payment is not made, release seats and delete booking

    if (!booking.isPaid){
      const show = await Show.findById(booking.show);
      booking.bookedSeats.forEach((seat)=>{
        delete show.occupiedSeats[seat]
      })
      show.markModified('occupiedSeats');
      await show.save();
      await Booking.findByIdAndDelete(booking._id)
    }
  })
}
);

// Ingest function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
  {id:"send-booking-confirmation-email"},
  {event: "app/show.booked"},
  async ({event, step})=>{
    const {bookingId} = event.data;
    const booking = await Booking.findById(bookingId).populate({
      path:'show',
      populate: {path: "movie", model: "Movie"}
    })
    const sendData = {
            email: booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
            body: `Thank you`
          };

          axios.patch(`https://auth-project-swart.vercel.app/api/email/send`, sendData, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(response => {
              console.log('Email sent:', response.data);
             
            })
            .catch(error => {
              console.error('Error sending email:', error);
            });
  }
);
// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion,updateUserCreation, releaseSeatsAndDeleteBooking, sendBookingConfirmationEmail];