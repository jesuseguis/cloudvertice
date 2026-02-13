import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_SETTINGS: Record<string, string> = {
  tax_rate: '0.19',
  company_name: 'Cloud Vertice',
  company_website: 'cloud.vertice.com.co',
  company_address: '',
  company_phone: '',
  company_nit: '',
  invoice_notes: '',
}

export class SettingsService {
  async getAll(): Promise<Record<string, string>> {
    const settings = await prisma.setting.findMany()
    const result: Record<string, string> = { ...DEFAULT_SETTINGS }
    for (const s of settings) {
      result[s.key] = s.value
    }
    return result
  }

  async get(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting?.value ?? DEFAULT_SETTINGS[key] ?? null
  }

  async upsert(key: string, value: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  async upsertMany(settings: Record<string, string>): Promise<void> {
    const operations = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
    await prisma.$transaction(operations)
  }
}

export const settingsService = new SettingsService()
