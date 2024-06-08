import dotenv from "dotenv"
import connectDB from './db/index.js';
import { app } from "./app.js";

dotenv.config({
    path : './env'
})
connectDB()
.then(() => {
    // app ke liye bhi error check karna hain as done in below commented code
    app.listen(process.env.PORT ||  8000, () => {
        console.log(`Listening at ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log(`MongoDB Connection Failed`,err);
})

// import express from 'express';
// const app = express()
// // IIFE
// ;(async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log(error);
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log('Listening on PORT ',process.env.PORT);
//         })
//     } catch(error) {
//         console.log('Error : ',error);
//         throw error
//     }
// })()