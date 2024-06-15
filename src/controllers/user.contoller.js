import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import {uploadOnCloudinary} from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const validation = (property,name) => {
    if(property === ""){
        return new ApiError(400,`${name} is missing`)
    } else {
        return null;
    }
}
const registerUser = asyncHandler(async (req,res) => { 2
    // get user data from frontend/postman
    // validation of details
    // check if user already exists -> username and email
    // check for images, check for avatar->required field
    // upload them to cloudinary-> avatar and cover if sended
    // create user object -> create entry in db
    // remove password and refresh token filed from response
    // check for user creation that if the user is sucessfully created
    // return response

    const {username,fullname,email,password} = req.body;
    console.log(fullname,username,email,password);

    const fn = validation(fullname,'fullname');
    const em = validation(email,'email');
    const un = validation(username,'username');
    const pass = validation(password,'password');

    if(fn !== null) throw fn;
    if(em !== null) throw em;
    if(un !== null) throw un;
    if(pass !== null) throw pass;

    const existingUser = await User.findOne({
        $or : [{ username },{ email }]
    })

    if(existingUser) {
        throw new ApiError(409,"User with exisiting details");
    }
    
    // multer gives access to files option
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avator-Image is required");
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath); // uploading is a time cosuming process
    

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
        
    } else {
        coverImageLocalPath = "";
    }
    const coverUpload = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatarUpload) {
        throw new ApiError(400,"Avator file is required");
    }

    const user = await User.create({
        fullname,
        avatar : avatarUpload.url,
        coverImage : coverUpload?.url || "",
        username : username.toLowerCase(),
        email,
        password
        
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"Something wrong while registring the user");
    } 

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Sucessfully")
    )
} )
const generateTokens = async (userId) => 
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false}); // saving the user without validation
        return {accessToken,refreshToken};
    } catch(error) {
        console.log(`Error in generating tokens`,error);
    }
};
const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token generation
    // send cookie

    const {username,email,password} = req.body;
    
    if(!username && !email) {
        throw new ApiError(400,"username or password is required");
    }

    const user = await User.findOne({ // instance of the object from the database
        $or : [{username},{email}]
    })
    if(!user) {
        throw new ApiError(404,"User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    let tokens;
    if(isPasswordCorrect) {
        tokens = await generateTokens(user._id);
    } else {
        throw new ApiError(404,"Incorrect Password");
    }

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const options = { // security
        httpOnly : true,
        secure : true
    }
    // console.log(req.user); -> undefined
    return res
    .status(200)
    .cookie("accessToken",tokens.accessToken,options)
    .cookie("refreshToken",tokens.refreshToken,options)
    .json(
        new ApiResponse(200,{
            user : loggedInUser,
            refreshToken : (tokens.refreshToken),
            accessToken : (tokens.accessToken)
        })
    )
})

const logoutUser = asyncHandler(async (req,res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true //returns the new object after updating details
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,user,"User LoggedOut Sucessfully"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Request");
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id);
    if(!user){
        throw new ApiError(401,"Invalid Refresh Token");
    }

    if(user?.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401,'Refresh Token is expired or used');
    }
    const {accessToken,newrefreshToken} = await generateTokens(user._id);
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
            new ApiResponse(200,{accessToken,refreshToken : newrefreshToken},`Tokens regenerated sucessfully`)
    )
    
})

const changeCurrentPassword = asyncHandler( async (req,res) => {
    const {oldPassword,newPassword} = req.body;
    const user = User.findById(req.user?._id);
    const isPassCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPassCorrect) {
        throw new ApiError(400,'Invalid old password');
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password Chnages Sucessfully")
    )
})

const getCurrentUser = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json(200,req.user,"Current User Fetched Sucessfully")
})

const updateAccountDetails = asyncHandler( async (req,res) => {
    const {fullname,email} = req.body; // joh joh chahiye woh lelo from body
    // for file updation use a different controller
    if(!fullname || !email) {
        throw new ApiError(400,"All Fields are Required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname : fullname,
                email : email
            }
        },
        {new : true} // update hone ke baad information return karta hain
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Upadated Sucessfully"))

})

const updateFiles = asyncHandler( async (req,res) => {
    // user avatar
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar File is Missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image Updates Sucessfully")
    )
})
// similary create a function for cover image too

const getUserChannelProfile = asyncHandler(async (req,res) => {
    const {username} = req.params;
    if(!username?.trim()) {
        throw new ApiError(400,`Username is missing`);
    }

    const channel = await User.aggregate([
        {
            $match: {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from: "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscriberTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscriberTo"
                },
                isSubscribed : {
                    $cond: {
                        if : {$in : [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1,
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404,`Channel Does Not Exist`)
    }
    console.log(channel);
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],`User Channel Fetched Sucessfully`)
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateFiles,
}