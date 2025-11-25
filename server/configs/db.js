import mongoose from "mongoose";

const connectDB = async () =>{
 try{
    await mongoose.connect(`${process.env.MONGODB_URI}`);
    mongoose.connection.on('connected', ()=>{
        console.log('Database connected')
    })
 }
 catch(e){
    console.log(e.message);
 }
}

export default connectDB;