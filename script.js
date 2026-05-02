let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let selectedTaskIndex = null;

let timer;
let time = 0;
let isRunning = false;
let isWorkMode = true;

let totalFocus = parseInt(localStorage.getItem("focus")) || 0;
let tasksDone = parseInt(localStorage.getItem("tasksDone")) || 0;

let focusChart, taskChart;

// DISPLAY
function updateDisplay() {
  let m = Math.floor(time / 60);
  let s = time % 60;
  document.getElementById("time").innerText =
    `${m}:${s < 10 ? '0' : ''}${s}`;
}

// SELECT TASK
function selectTask(index) {
  selectedTaskIndex = index;
  let task = tasks[index];

  isWorkMode = true;
  time = task.work * 60;

  document.getElementById("mode").innerText =
    `Working on: ${task.text}`;

  updateDisplay();
}

// TIMER
function startTimer() {
  if (selectedTaskIndex === null) {
    alert("Select a task first!");
    return;
  }

  if (isRunning) return;
  isRunning = true;

  timer = setInterval(() => {
    if (time > 0) {
      time--;
      updateDisplay();
    } else {
      clearInterval(timer);
      isRunning = false;

      let task = tasks[selectedTaskIndex];

      if (isWorkMode) {
        totalFocus += task.work;
        logSession(task.text);

        alert("Work done! Break time.");
        isWorkMode = false;
        time = task.break * 60;
      } else {
        alert("Break over!");
        isWorkMode = true;
        time = task.work * 60;
      }

      localStorage.setItem("focus", totalFocus);
      updateStats();
      updateDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;

  if (selectedTaskIndex !== null) {
    let task = tasks[selectedTaskIndex];
    time = task.work * 60;
  }

  updateDisplay();
}

// ADD TASK
function addTask() {
  let text = document.getElementById("taskInput").value;
  let work = document.getElementById("workTimeInput").value;
  let brk = document.getElementById("breakTimeInput").value;
  let priority = document.getElementById("priorityInput").value;
  let deadline = document.getElementById("deadlineInput").value;

  if (!text || !work || !brk) return;

  tasks.push({
    text,
    work: parseInt(work),
    break: parseInt(brk),
    priority,
    deadline,
    done: false
  });

  saveTasks();
  renderTasks();
  showSuggestion();
}

// RENDER TASKS
function renderTasks() {
  let list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((t, index) => {
    let li = document.createElement("li");

    li.innerHTML = `
      <span class="${t.done ? 'done' : ''}">
        ${t.text} (${t.work}m/${t.break}m)
      </span>
      <button onclick="selectTask(${index})">▶</button>
      <button onclick="toggleTask(${index})">✔</button>
      <button onclick="deleteTask(${index})">❌</button>
    `;

    list.appendChild(li);
  });
}

// COMPLETE TASK
function toggleTask(index) {
  tasks[index].done = !tasks[index].done;

  if (tasks[index].done) {
    tasksDone++;
    localStorage.setItem("tasksDone", tasksDone);
  }

  saveTasks();
  renderTasks();
  updateStats();
  showSuggestion();
}

// DELETE TASK
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
  showSuggestion();
}

// PLAN GENERATION 🔥
function generatePlan() {
  let planList = document.getElementById("planList");
  planList.innerHTML = "";

  let pending = tasks.filter(t => !t.done);

  let priorityOrder = { High: 3, Medium: 2, Low: 1 };

  pending.sort((a, b) => {
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }

    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }

    return a.work - b.work;
  });

  pending.forEach(t => {
    let li = document.createElement("li");
    li.innerText = `${t.text} (${t.priority})`;
    planList.appendChild(li);
  });
}

// SUGGESTION
function showSuggestion() {
  let pending = tasks.filter(t => !t.done);

  if (pending.length === 0) {
    document.getElementById("suggestion").innerText =
      "Suggested: No tasks";
    return;
  }

  document.getElementById("suggestion").innerText =
    `Suggested: ${pending[0].text}`;
}

// PRODUCTIVITY
function getProductivityScore() {
  let score = (tasksDone * 10) + (totalFocus / 5);
  return Math.min(100, Math.floor(score));
}

function dailyAdvice() {
  if (totalFocus < 30) return "Start small.";
  if (totalFocus > 120) return "Take breaks.";
  return "Good progress!";
}

// LOGS
function logSession(taskName) {
  let logs = JSON.parse(localStorage.getItem("logs")) || [];
  logs.push({ task: taskName, time: new Date().toLocaleTimeString() });
  localStorage.setItem("logs", JSON.stringify(logs));
}

// STATS
function updateStats() {
  document.getElementById("focusTime").innerText = totalFocus;
  document.getElementById("tasksDone").innerText = tasksDone;

  document.getElementById("score").innerText =
    getProductivityScore() + "%";

  document.getElementById("advice").innerText =
    dailyAdvice();

  saveDailyData();
  loadCharts();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// CHARTS
function getToday() {
  return new Date().toLocaleDateString();
}

function saveDailyData() {
  let today = getToday();

  let focusData = JSON.parse(localStorage.getItem("dailyFocus")) || {};
  let taskData = JSON.parse(localStorage.getItem("dailyTasks")) || {};

  focusData[today] = totalFocus;
  taskData[today] = tasksDone;

  localStorage.setItem("dailyFocus", JSON.stringify(focusData));
  localStorage.setItem("dailyTasks", JSON.stringify(taskData));
}

function loadCharts() {
  let focusData = JSON.parse(localStorage.getItem("dailyFocus")) || {};
  let taskData = JSON.parse(localStorage.getItem("dailyTasks")) || {};

  let labels = Object.keys(focusData);

  if (focusChart) focusChart.destroy();
  if (taskChart) taskChart.destroy();

  focusChart = new Chart(document.getElementById("focusChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Focus Time", data: Object.values(focusData) }]
    }
  });

  taskChart = new Chart(document.getElementById("taskChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Tasks Done", data: Object.values(taskData) }]
    }
  });
}

// INIT
updateDisplay();
renderTasks();
updateStats();
showSuggestion();
loadCharts();