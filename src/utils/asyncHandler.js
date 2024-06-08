const asyncHandler =  (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => {
            return next(err);
        })
    }
}

export {asyncHandler}

// const asyncHandler = (fn) => {
//     return async (req,res,next) => {
//         try {
//             await fn(req,res,next);
//         } catch (error) {
//             res.status(error.code || 500).json({
//                 sucess : false,
//                 message : err.message
//             });
//         }
//     }
// }