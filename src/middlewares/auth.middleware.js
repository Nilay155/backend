import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import {User} from '../models/user.models.js';

export const verifyJWT = asyncHandler( async (req,res,next) => {
    try {
        const accessTkn = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","");
    
        if(!accessTkn){
            throw new ApiError(401,"Unauthorized Request");
        }
        const decodedToken = jwt.verify(accessTkn,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user) {
            throw new ApiError(401,"Invalid AccessToken");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,"Error in JWT-VERIFICATION",error);
    }
})