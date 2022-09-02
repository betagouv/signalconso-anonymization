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
  companies: ['siret', 'name', 'street', 'address_supplement'],
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
  ],
  subscriptions: ['email'],
  users: ['firstname', 'lastname', 'email'],
  websites: ['host'],
  // TODO tables à reactiver : existe en prod uniquement
  // reports_old: [
  //   'place',
  //   'place_address',
  //   'description',
  //   'firstname',
  //   'lastname',
  //   'email',
  // ],
  // sendinblue: ['subject', 'destination', 'mid'],
}

export const createAnonymizeFunctionsSql = [
  `
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
  `,
  `
CREATE OR REPLACE FUNCTION anonymize_array(
  arr character varying[]
)
RETURNS character varying[]
AS
$$
  BEGIN
  RETURN array_agg(anonymize(n)) FROM unnest(arr) AS n;
    END;
$$
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT 
  `,

  `
CREATE OR REPLACE FUNCTION anonymize_json_obj(
  json_obj jsonb
)
RETURNS jsonb
AS
$$
  BEGIN
  RETURN json_object_agg(key, anonymize(value)) FROM jsonb_each_text(json_obj);
    END;
$$
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT 
  `,
]
