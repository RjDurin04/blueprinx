import { Router } from 'express';
import { generatePlan } from './ai.controller';

const router = Router();

router.post('/generate', generatePlan);

export default router;
