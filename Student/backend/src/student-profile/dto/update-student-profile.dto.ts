export class UpdateStudentProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  zodiac?: string;
  avatarUrl?: string;
  method?: string;
  weeklyHours?: string;
  classEnvironment?: string;
  ieltsMeaning?: string;
  previousBand?: string;
  focusSkills?: string | string[];
}
