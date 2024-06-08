import mongoose from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new mongoose.Schema(
    {
        videoFile : {
            type : String, // url
            required : true
        },
        thumbnail : {
            type : String,
            required : true
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : [true,"Enter a Decription"]
        },
        duration : {
            type : Number,
            required : true,
            // will get the duration from cloudnary url
        },
        views : {
            type : Number,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner :{
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
);

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model('Video',videoSchema);