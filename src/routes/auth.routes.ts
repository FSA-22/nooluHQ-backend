import { Router, Request, Response } from 'express';

const authRouter = Router();

authRouter.post('/register', (req: Request, res: Response) => {
  res.json({ message: 'Register endpoint' });
});

authRouter.post('/login', (req: Request, res: Response) => {
  res.json({ message: 'Login endpoint' });
});

export default authRouter;
