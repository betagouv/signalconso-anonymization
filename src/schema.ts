// We only declare the fields that we need

import { sql } from 'kysely'

export type Schema = {
  reports: {
    id: string
    creation_date: Date
    status: string
    category: string
    tags: string[]
    company_id: string | undefined
    company_name: string | undefined
  }
  company_accesses: {
    user_id: string
    company_id: string
  }
  companies: {
    id: string
    department: string | undefined
  }
  events: {
    id: string
    report_id: string | undefined
    creation_date: Date
    action: string
  }
}

export const anonDbResetSqls = [
  sql`DROP TABLE IF EXISTS reports`,
  sql`CREATE TABLE reports (
      id uuid NOT NULL,
      creation_date timestamp with time zone NOT NULL,
      status text NOT NULL,
      category text NOT NULL,
      tags text[] NOT NULL,
      company_id uuid,
      company_name text
  )`,
  sql`DROP TABLE IF EXISTS company_accesses`,
  sql`CREATE TABLE company_accesses (
      user_id uuid NOT NULL,
      company_id uuid NOT NULL
  )`,
  sql`DROP TABLE IF EXISTS companies`,
  sql`CREATE TABLE companies (
      id uuid NOT NULL,
      department text
  )`,
  sql`DROP TABLE IF EXISTS events`,
  sql`CREATE TABLE events (
      id uuid NOT NULL,
      report_id uuid,
      creation_date timestamp with time zone NOT NULL,
      action text
  )`,
]
