import { userModel } from '../../../DB/model/user.model.js';
import { sendEmailService } from '../../services/sendEmail.js';
import { CustomError } from '../../utilities/customError.js';
import { emailTemplate } from '../../utilities/emailTemplate.js';
import { generateToken } from '../../utilities/tokenFunctions.js';
import bcrypt from 'bcryptjs';

// Register
export const registerUser = async (userData) => {
    const { userName, email, password, role } = userData;
    
    // Check if email exists
    if (await userModel.findOne({ email })) {
        throw new CustomError("Email already exists", 409);
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const user = await userModel.create({
        userName,
        email,
        password: hashedPassword,
        role: role || 'Student'
    });

    return user;
};

export const addUserWithImage = async (userData) => {
  const { userName, email, password, role, image, customId } = userData;

  if (await userModel.findOne({ email })) {
    throw new CustomError("Email already exists", 409);
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  const user = await userModel.create({
    userName,
    email,
    password: hashedPassword,
    role: role || "Student",
    image: {
      secure_url: image.secure_url,
      public_id: image.public_id,
    },
    customId,
  });

  return user;
};

// Login
export const loginUser = async ({ email, password }) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        throw new CustomError("Invalid email or password", 400);
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
        throw new CustomError("Invalid email or password", 400);
    }

    if (user.isBlocked) {
        throw new CustomError("Account is blocked", 403);
    }

    // Generate Token
    const token = generateToken({
        payload: {
            _id: user._id,
            email: user.email,
            role: user.role
        },
        signature: process.env.DEFAULT_SIGNATURE || 'test_secret', // Fallback for dev
        expiresIn: '1d'
    });

    // Save session token for single device login
    user.currentSessionToken = token;
    await user.save();

    return { user, token };
};

// Services Stub (Implementing others just to avoid crash, basic logic)
export const getAllUsersService = async () => userModel.find();
export const getOneUserService = async (id) => userModel.findById(id);
export const createNewUser = async (data) => registerUser(data); // Re-use register
import crypto from 'crypto';

// Update User
export const updateUserService = async ({ id, ...updateData }) => {
    // Prevent updating critical fields directly if needed, for now allow all passed
    // But we should re-hash password if it's being updated
    if (updateData.password) {
        updateData.password = bcrypt.hashSync(updateData.password, 8);
    }
    
    const user = await userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) throw new CustomError("User not found", 404);
    return user;
};

// Delete User
export const deleteUserService = async (id) => {
    const user = await userModel.findByIdAndDelete(id);
    if (!user) throw new CustomError("User not found", 404);
    return user;
};

export const deleteUsersService = async (ids) => {
    const result = await userModel.deleteMany({ _id: { $in: ids } });
    return result;
};

export const logoutService = async (token) => {
    await userModel.findOneAndUpdate({ currentSessionToken: token }, { currentSessionToken: null });
    return true;
};

// Forgot Password
export const initiateForgotPasswordService = async (email) => {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError("Email not found", 404);

  
    const code = nanoid()
    const hashcode = pkg.hashSync(code, +process.env.SALT_ROUNDS) // ! process.env.SALT_ROUNDS
    const token = generateToken({
        payload:{
            email,
            sendCode:hashcode,
        },
        signature: process.env.RESET_TOKEN, // ! process.env.RESET_TOKEN
        expiresIn: '1h',
    })
    const resetPasswordLink = `${req.protocol}://${req.headers.host}/user/reset/${token}`
    const isEmailSent = sendEmailService({
        to:email,
        subject: "Reset Password",
        message: emailTemplate({
            link:resetPasswordLink,
            linkData:"Click Here Reset Password",
            subject: "Reset Password",
        }),
    })
    if(!isEmailSent){
        return res.status(400).json({message:"Email not found"})
    }

    const userupdete = await userModel.findOneAndUpdate(
        {email},
        {forgetCode:hashcode},
        {new: true},
    )
    return res.status(200).json({message:"password changed",userupdete})
};

// Reset Password
export const resetPasswordService = async (token, newPassword) => {

    const decoded = verifyToken({token, signature: process.env.RESET_TOKEN}) // ! process.env.RESET_TOKEN
    const user = await userModel.findOne({
        email: decoded?.email,
        fotgetCode: decoded?.sentCode
    })

    if(!user){
        return res.status(400).json({message: "you are alreade reset it , try to login"})
    }

    const hashedPassword = pkg.hashSync(newPassword, +process.env.SALT_ROUNDS)
    user.password = hashedPassword,
    user.forgetCode = null

    const updatedUser = await user.save()
    res.status(200).json({message: "Done",updatedUser})
};

// Change Password (Logged in)
export const changePasswordService = async (email, newPassword) => {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError("User not found", 404);

    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();
    return user;
};
