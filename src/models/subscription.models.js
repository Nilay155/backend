import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber : {
            type : mongoose.Schema.Types.ObjectId, // one who is subscribing
            ref : "User"
        },
        channel : {
            type : mongoose.Schema.Types.ObjectId, // the one whose channel is subscribed
            ref : "User"
        }

    },
    {
        timestamps : true
    }
);

export const Subscription = mongoose.models("Subscription",subscriptionSchema);