import dotenv from "dotenv"
import connectDB from './db/index.js';
dotenv.config({
    path : './env'
})
connectDB()

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