export type FieldDefinition =
  | string
  | {
      name: string
      type: 'array_of_string' | 'json'
    }

export const fieldsToAnonymizeByTable: {
  [table: string]: FieldDefinition[]
} = {
  access_tokens: ['emailed_to'],
  auth_attempts: ['login'],
  companies: ['siret', 'name', 'street', 'address_supplement', 'brand'],
  emails_validation: ['email'],
  events: [{ name: 'details', type: 'json' }],
  report_consumer_review: ['details'],
  report_files: ['filename', 'storage_filename', 'av_output'],
  reports: [
    'company_name',
    'first_name',
    'last_name',
    'email',
    'company_siret',
    'website_url',
    'phone',
    'company_street_number',
    'company_street',
    'company_address_supplement',
    'host',
    'consumer_phone',
    'consumer_reference_number',
    { name: 'details', type: 'array_of_string' },
    'influencer_name',
    'company_brand',
    'barcode_product_id'
  ],
  subscriptions: ['email'],
  users: ['login', 'firstname', 'lastname', 'email'],
  websites: ['host'],
  blacklisted_emails: ['email', 'comments'],
  signalconso_review: ['details'],
  company_activation_attempts: ['siret'],
}

const anonymizeFunctionSql = `
CREATE OR REPLACE FUNCTION anonymize(
  str TEXT
)
  RETURNS TEXT 
  AS $$
    BEGIN
      IF str = '' THEN
        RETURN '';
      ELSE
        RETURN CONCAT('anon_', MD5(str));
      END IF;
    END;
  $$ 
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT   
  `

const anonymizeArrayFunctionSql = `
  CREATE OR REPLACE FUNCTION anonymize_array(
    arr character varying[]
  )
  RETURNS character varying[]
  AS
  $$
    DECLARE
      result character varying[];
    BEGIN
        result := array_agg(anonymize(n)) FROM unnest(arr) AS n;
        IF result IS NULL THEN
          RETURN ARRAY[]::character varying[];
        ELSE
          RETURN result;
        END IF;
    END;
  $$
  LANGUAGE plpgsql
  IMMUTABLE
  RETURNS NULL ON NULL INPUT
  `

const anonymizeJsonObjFunctionSql = `
CREATE OR REPLACE FUNCTION anonymize_json_obj(
  json_obj jsonb
)
RETURNS jsonb
AS
$$
  DECLARE
    result jsonb;
  BEGIN
    result := json_object_agg(key, anonymize(value)) FROM jsonb_each_text(json_obj);
    IF result IS NULL THEN
      RETURN '{}'::jsonb;
    ELSE
      RETURN result;
    END IF;
  END;
$$
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT 
  `

export const anonymizationFunctionsSql = [
  anonymizeFunctionSql,
  anonymizeArrayFunctionSql,
  anonymizeJsonObjFunctionSql,
]
