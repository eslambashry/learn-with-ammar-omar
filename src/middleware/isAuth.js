import { userModel } from '../../DB/model/user.model.js';
import { verifyToken } from '../utilities/tokenFunctions.js';
import { CustomError } from '../utilities/customError.js'; // Make sure the path is correct

export const isAuth = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(" ")[1] || req.headers.Authorization?.split(" ")[1];

        // 1. Check if token exists
        if (!token) {
            return next(new CustomError("Authentication required. Please log in.", 401));
        }
        
        // 2. Verify the token
        const decoded = verifyToken(token);
        
        if (!decoded?._id) {
            return next(new CustomError("Invalid or expired token.", 401));
        }

        // 3. Find user in Database
        const user = await userModel.findById(decoded._id);
        if (!user) {
            return next(new CustomError("User not found.", 404));
        }

        // 4. Anti-Multi-Device Logic:
        // Compare current token with the one stored in DB
        if (user.currentSessionToken !== token) {
            return next(new CustomError("Session expired. This account is logged in from another device.", 401));
        }

        // 5. Check if user is blocked
        if (user.isBlocked) {
            return next(new CustomError("Your account has been blocked. Please contact support.", 403));
        }

        // Attach user to request and move forward
        req.user = user;
        next();

    } catch (error) {
        // Catch any unexpected errors (like JWT malformed)
        return next(new CustomError(error.message || "Authentication failed.", 500));
    }
};

export const isAdmin = async (req, res, next) => {
try{
    const token = req.headers.token || req.headers.authorization?.split(" ")[1] || req.headers.Authorization?.split(" ")[1];

        // 1. Check if token exists
        if (!token) {
            return next(new CustomError("Authentication required. Please log in.", 401));
        }
        
        // 2. Verify the token
        const decoded = verifyToken(token);
        
        if (!decoded?._id) {
            return next(new CustomError("Invalid or expired token.", 401));
        }

        // 3. Find user in Database
        const user = await userModel.findById(decoded._id);
        if (!user) {
            return next(new CustomError("User not found.", 404));
        }

  if (req.user.role !== 'Admin') {
    return next(new CustomError('Access denied. Admins only.', 403));
  }

  next();
      } catch (error) {
        // Catch any unexpected errors (like JWT malformed)
        return next(new CustomError(error.message || "Authentication failed.", 500));
    }
};