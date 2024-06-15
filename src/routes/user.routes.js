import { Router } from 'express';
import { loginUser, logoutUser, registerUser, refreshAccessToken } from '../controllers/user.contoller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(upload.fields([ // upload middleware ki tarah act kar raha
    {
        name:"avatar",
        maxCount : 1
    },
    {
        name : "coverImage",
        maxCount : 1
    }
]),registerUser);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refreshTokens").post(refreshAccessToken);

export default router