export type SessionType = 'work' | 'break';

export interface PomodoroState {
  sessionType: SessionType;
  timeRemaining: number;
  isRunning: boolean;
  completedPomodoros: number;
  totalTimeSpent: number; // in seconds
  completedSessionType?: SessionType; // Track which session just completed
}

const DEFAULT_TIMES = {
  work: 25 * 60, // 25 minutes
  break: 5 * 60, // 5 minutes
};

export class PomodoroTimer {
  private state: PomodoroState;
  private intervalId: number | null = null;
  private onTickCallbacks: ((state: PomodoroState) => void)[] = [];
  private onCompleteCallbacks: (() => void)[] = [];
  private customTimes: { work: number; break: number };

  constructor() {
    this.customTimes = { ...DEFAULT_TIMES };
    this.state = {
      sessionType: 'work',
      timeRemaining: this.customTimes.work,
      isRunning: false,
      completedPomodoros: 0,
      totalTimeSpent: 0,
    };
  }

  start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 1000);
    this.notifyListeners();
  }

  pause(): void {
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.notifyListeners();
  }

  reset(): void {
    this.pause();
    this.state.timeRemaining = this.customTimes[this.state.sessionType];
    this.notifyListeners();
  }

  switchSession(sessionType: SessionType): void {
    this.pause();
    this.state.sessionType = sessionType;
    this.state.timeRemaining = this.customTimes[sessionType];
    this.notifyListeners();
  }

  setCustomTime(sessionType: SessionType, minutes: number): void {
    this.customTimes[sessionType] = minutes * 60;
    if (this.state.sessionType === sessionType && !this.state.isRunning) {
      this.state.timeRemaining = this.customTimes[sessionType];
      this.notifyListeners();
    }
  }

  getCustomTime(sessionType: SessionType): number {
    return Math.floor(this.customTimes[sessionType] / 60);
  }

  private tick(): void {
    this.state.timeRemaining--;

    // Track time spent only during work sessions
    if (this.state.sessionType === 'work') {
      this.state.totalTimeSpent++;
    }

    if (this.state.timeRemaining <= 0) {
      this.handleSessionComplete();
    } else {
      this.notifyListeners();
    }
  }

  private handleSessionComplete(): void {
    const completedSessionType = this.state.sessionType;
    this.state.completedSessionType = completedSessionType;
    
    this.pause();
    
    if (this.state.sessionType === 'work') {
      this.state.completedPomodoros++;
      this.switchSession('break');
    } else {
      this.switchSession('work');
    }

    this.notifyCompleteListeners();
    
    // Automatically start the next session
    this.start();
  }

  onTick(callback: (state: PomodoroState) => void): void {
    this.onTickCallbacks.push(callback);
  }

  onComplete(callback: () => void): void {
    this.onCompleteCallbacks.push(callback);
  }

  private notifyListeners(): void {
    this.onTickCallbacks.forEach(callback => callback(this.state));
  }

  private notifyCompleteListeners(): void {
    this.onCompleteCallbacks.forEach(callback => callback());
  }

  getState(): PomodoroState {
    return { ...this.state };
  }
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getSessionLabel(sessionType: SessionType): string {
  switch (sessionType) {
    case 'work':
      return 'Focus Time';
    case 'break':
      return 'Break Time';
  }
}

export function formatTotalTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}hours ${minutes} mins`;
  }
  return `${minutes} mins`;
}
