export const fieldsToAnonymizeByTable: { [table: string]: string[] } = {
  access_tokens: ['emailed_to'],
  auth_attempts: ['login'],
  companies: ['siret', 'name', 'street', 'address_supplement'],
  emails_validation: ['email'],
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
  ],
  // TODO a reactiver : existe en prod uniquement
  // reports_old: [
  //   'place',
  //   'place_address',
  //   'description',
  //   'firstname',
  //   'lastname',
  //   'email',
  // ],
  // TODO pareil : existe en prod uniquement
  // sendinblue: ['subject', 'destination', 'mid'],
  subscriptions: ['email'],
  users: ['firstname', 'lastname', 'email'],
  websites: ['host'],

  // jsons à gérer
  // events -> details
  // reports -> details
}

export const createAnonymizeFunctionSql = `
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
