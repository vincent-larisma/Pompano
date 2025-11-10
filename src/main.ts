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
// Preload audio to unlock autoplay restrictions
let audioUnlocked = false;
const preloadedAudios: { [key: string]: HTMLAudioElement } = {};

function unlockAudio() {
  if (audioUnlocked) return;
  
  console.log('Unlocking audio context...');
  // Create and play silent audio to unlock autoplay
  const silentAudio = new Audio();
  silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1f///////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAYYQNAZQAAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';
  silentAudio.volume = 0.01;
  silentAudio.play().then(() => {
    console.log('Audio context unlocked successfully');
    audioUnlocked = true;
    
    // Preload actual sound files
    const focusPath = `${import.meta.env.BASE_URL}sounds/focus_finished.mp3`;
    const breakPath = `${import.meta.env.BASE_URL}sounds/break_finished.m4a`;
    
    console.log('Preloading focus sound:', focusPath);
    preloadedAudios['focus'] = new Audio(focusPath);
    preloadedAudios['focus'].load();
    
    console.log('Preloading break sound:', breakPath);
    preloadedAudios['break'] = new Audio(breakPath);
    preloadedAudios['break'].load();
  }).catch(err => {
    console.error('Failed to unlock audio:', err);
  });
}

function playAlarmSound(sessionType: SessionType) {
  console.log(`Playing alarm sound for session type: ${sessionType}`);
  
  if (sessionType === 'work') {
    // Focus completed - play focus_finished.mp3 3 times
    let playCount = 0;
    const playFocusSound = () => {
      const soundPath = `${import.meta.env.BASE_URL}sounds/focus_finished.mp3`;
      console.log(`Attempting to play focus sound (${playCount + 1}/3) from: ${soundPath}`);
      const audio = new Audio(soundPath);
      
      audio.addEventListener('error', (e) => {
        console.error('Error loading focus sound:', e);
        console.error('Attempted path:', soundPath);
      });
      
      audio.play().then(() => {
        console.log(`Focus sound playing successfully (${playCount + 1}/3)`);
      }).catch(err => {
        console.error('Error playing focus sound:', err);
      });
      
      playCount++;
      
      audio.onended = () => {
        console.log(`Focus sound ended (${playCount}/3)`);
        if (playCount < 3) {
          playFocusSound();
        }
      };
    };
    playFocusSound();
  } else {
    // Break completed - play break_finished.m4a once
    const soundPath = `${import.meta.env.BASE_URL}sounds/break_finished.m4a`;
    console.log(`Attempting to play break sound from: ${soundPath}`);
    const audio = new Audio(soundPath);
    
    audio.addEventListener('error', (e) => {
      console.error('Error loading break sound:', e);
      console.error('Attempted path:', soundPath);
    });
    
    audio.play().then(() => {
      console.log('Break sound playing successfully');
    }).catch(err => {
      console.error('Error playing break sound:', err);
    });
    
    audio.onended = () => {
      console.log('Break sound ended');
    };
  }
}

function playFirstPomodoroSound() {
  console.log('Playing sound for first pomodoro start');
  // Play break_finished.m4a once when starting the first pomodoro
  const soundPath = `${import.meta.env.BASE_URL}sounds/break_finished.m4a`;
  console.log(`Attempting to play first pomodoro sound from: ${soundPath}`);
  const audio = new Audio(soundPath);
  
  audio.addEventListener('error', (e) => {
    console.error('Error loading first pomodoro sound:', e);
    console.error('Attempted path:', soundPath);
  });
  
  audio.play().then(() => {
    console.log('First pomodoro sound playing successfully');
  }).catch(err => {
    console.error('Error playing first pomodoro sound:', err);
  });
  
  audio.onended = () => {
    console.log('First pomodoro sound ended');
  };
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
    // Unlock audio on first user interaction
    unlockAudio();
    
    // Check if this is the first start (no pomodoros completed yet)
    if (state.completedPomodoros === 0 && state.sessionType === 'work') {
      playFirstPomodoroSound();
    }
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
