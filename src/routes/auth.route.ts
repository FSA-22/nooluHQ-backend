import { Router } from 'express';
import { registerAccount, verifyOtp } from '../controllers/auth.controller.ts';

const authRouter = Router();

authRouter.post('/account', registerAccount);
authRouter.post('/verify-otp', verifyOtp);

export default authRouter;
