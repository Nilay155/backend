import {Router} from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/user.contoller.js';
import { upload } from '../middlewares/multer.middleware.js';
import {verifyJWT} from '../middlewares/auth.middleware.js';

const router = Router()
// upload middleware ki tarah act kar raha
router.route("/register").post(upload.fields([
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
export default router