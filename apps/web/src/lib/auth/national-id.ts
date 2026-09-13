// Egyptian national ID numbers are 14 digits. This checks shape only — the embedded
// century/birthdate/governorate-code structure isn't validated here; that level of
// detail belongs with whichever real KYC vendor (see docs/projects/groundtruth-vendor-spike.md)
// ends up doing actual document verification, not this placeholder check.
const NATIONAL_ID = /^\d{14}$/;

export function isEgyptianNationalId(id: string): boolean {
  return NATIONAL_ID.test(id);
}
