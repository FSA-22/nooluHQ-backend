import { Router } from 'express';
import {
  registerAccount,
  loginAccount,
  resendOtp,
  verifyOtp,
  googleLogin,
} from '../controllers/auth.controller.ts';

const authRouter = Router();

authRouter.post('/register', registerAccount);
authRouter.post('/google-login', googleLogin);
authRouter.post('/login', loginAccount);
authRouter.post('/verify-otp', verifyOtp);
authRouter.post('/resend-otp', resendOtp);

export default authRouter;
