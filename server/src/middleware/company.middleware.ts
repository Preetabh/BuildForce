import { Request, Response, NextFunction } from 'express';

export const requireCompany = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!req.user.companyId) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: User is not associated with a company',
    });
    return;
  }

  next();
};
