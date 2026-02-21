export interface Photo {
  id: string;
  url: string;
  timestamp: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  photos: Photo[];
  createdAt: number;
}

export interface BigGoal {
  id: string;
  title: string;
  completed: boolean;
  photos: Photo[];
  subTasks: SubTask[];
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  content: string;
  photos: Photo[];
  date: string; // ISO string for the day
  createdAt: number;
}

export interface AppState {
  goals: BigGoal[];
  diaryEntries: DiaryEntry[];
  isSubscribed: boolean;
}
