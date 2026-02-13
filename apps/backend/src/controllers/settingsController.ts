import { Request, Response, NextFunction } from 'express'
import { settingsService } from '../services/settingsService'

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getAll()

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = req.body as Record<string, string>

    await settingsService.upsertMany(settings)

    const updated = await settingsService.getAll()

    res.json({
      success: true,
      data: updated,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    next(error)
  }
}
