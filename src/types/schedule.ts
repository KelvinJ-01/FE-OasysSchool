export interface CreateScheduleRequest {
  classId: string;
  subjectId: string;
  teacherId: string;
  academicTermId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type UpdateScheduleRequest = Partial<CreateScheduleRequest>;