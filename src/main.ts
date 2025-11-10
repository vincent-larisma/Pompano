import './style.css';
import { PomodoroTimer, formatTime, formatTotalTime, getSessionLabel, type SessionType } from './pomodoro';

const timer = new PomodoroTimer();

// Get elements from DOM
const timeDisplay = document.querySelector<HTMLDivElement>('.time')!;
const sessionLabel = document.querySelector<HTMLDivElement>('.session-label')!;
const pauseBtn = document.querySelector<HTMLButtonElement>('#pauseBtn')!;
const completedPomodorosDisplay = document.querySelector<HTMLSpanElement>('#completedPomodoros')!;
const totalTimeSpentDisplay = document.querySelector<HTMLSpanElement>('#totalTimeSpent')!;
const sessionTabs = document.querySelectorAll<HTMLButtonElement>('.session-tab');
const focusTimeInput = document.querySelector<HTMLInputElement>('#focusTime')!;
const breakTimeInput = document.querySelector<HTMLInputElement>('#breakTime')!;
// Audio files for alarm sounds (note: these are created fresh each time to avoid replay issues)

function playAlarmSound(sessionType: SessionType) {
  if (sessionType === 'work') {
    // Focus completed - play focus_finished.mp3 3 times
    let playCount = 0;
    const playFocusSound = () => {
      const audio = new Audio('/sounds/focus_finished.mp3');
      audio.play();
      playCount++;
      
      audio.onended = () => {
        if (playCount < 3) {
          playFocusSound();
        }
      };
    };
    playFocusSound();
  } else {
    // Break completed - play break_finished.m4a once
    const audio = new Audio('/sounds/break_finished.m4a');
    audio.play();
  }
}

// Update UI based on timer state
function updateUI() {
  const state = timer.getState();
  timeDisplay.textContent = formatTime(state.timeRemaining);
  sessionLabel.textContent = getSessionLabel(state.sessionType);
  pauseBtn.textContent = state.isRunning ? 'Pause' : 'Start';
  completedPomodorosDisplay.textContent = state.completedPomodoros.toString();
  totalTimeSpentDisplay.textContent = formatTotalTime(state.totalTimeSpent);
  
  // Update active session tab
  sessionTabs.forEach(tab => {
    const tabSession = tab.dataset.session as SessionType;
    if (tabSession === state.sessionType) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update page title
  document.title = `${formatTime(state.timeRemaining)} - Pompano`;
}

// Event handlers
pauseBtn.addEventListener('click', () => {
  const state = timer.getState();
  if (state.isRunning) {
    timer.pause();
  } else {
    timer.start();
  }
});

sessionTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const sessionType = tab.dataset.session as SessionType;
    timer.switchSession(sessionType);
  });
});

// Handle time input changes
focusTimeInput.addEventListener('change', () => {
  const minutes = parseInt(focusTimeInput.value);
  if (minutes >= 1 && minutes <= 60) {
    timer.setCustomTime('work', minutes);
  } else {
    focusTimeInput.value = timer.getCustomTime('work').toString();
  }
});

breakTimeInput.addEventListener('change', () => {
  const minutes = parseInt(breakTimeInput.value);
  if (minutes >= 1 && minutes <= 30) {
    timer.setCustomTime('break', minutes);
  } else {
    breakTimeInput.value = timer.getCustomTime('break').toString();
  }
});

// Listen to timer updates
timer.onTick(updateUI);

// Listen to session completion
timer.onComplete(() => {
  const state = timer.getState();
  const completedType = state.completedSessionType;
  
  if (completedType) {
    // Play alarm sound only
    playAlarmSound(completedType);
  }
});


// Initial UI update
updateUI();
