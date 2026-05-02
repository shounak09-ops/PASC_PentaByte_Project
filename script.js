let time = 25 * 60;
let timer;
let isRunning = false;

function updateDisplay() {
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;

  document.getElementById("time").innerText =
    `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function startTimer() {
  if (isRunning) return;

  isRunning = true;

  timer = setInterval(() => {
    if (time > 0) {
      time--;
      updateDisplay();
    } else {
      clearInterval(timer);
      alert("Time's up! Take a break!");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  time = 25 * 60;
  isRunning = false;
  updateDisplay();
}

// TASKS
function addTask() {
  let input = document.getElementById("taskInput");
  let taskText = input.value;

  if (taskText === "") return;

  let li = document.createElement("li");
  li.innerText = taskText;

  document.getElementById("taskList").appendChild(li);

  input.value = "";
}

// Initialize
updateDisplay();