let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let selectedTaskIndex = null;

let timer;
let time = 0;
let isRunning = false;
let isWorkMode = true;

// Stats
let totalFocus = parseInt(localStorage.getItem("focus")) || 0;
let tasksDone = parseInt(localStorage.getItem("tasksDone")) || 0;

// Chart
let focusChart;

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
        localStorage.setItem("focus", totalFocus);

        alert("Work done! Break time.");
        isWorkMode = false;
        time = task.break * 60;
      } else {
        alert("Break over!");
        isWorkMode = true;
        time = task.work * 60;
      }

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

  if (!text || !work || !brk) return;

  tasks.push({
    text,
    work: parseInt(work),
    break: parseInt(brk),
    priority,
    done: false
  });

  saveTasks();
  renderTasks();

  document.getElementById("taskInput").value = "";
  document.getElementById("workTimeInput").value = "";
  document.getElementById("breakTimeInput").value = "";
}

// RENDER TASKS
function renderTasks() {
  let list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((t, index) => {
    let li = document.createElement("li");

    li.innerHTML = `
      <span class="${t.done ? 'done' : ''}">
        ${t.text} [${t.priority}] (Work: ${t.work}m)
      </span>
      <button onclick="selectTask(${index})">▶</button>
      <button onclick="toggleTask(${index})">✔</button>
      <button onclick="deleteTask(${index})">❌</button>
    `;

    list.appendChild(li);
  });
}

// TOGGLE TASK
function toggleTask(index) {
  tasks[index].done = !tasks[index].done;

  if (tasks[index].done) {
    tasksDone++;
    localStorage.setItem("tasksDone", tasksDone);
  }

  saveTasks();
  renderTasks();
  updateStats();
}

// DELETE TASK
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

// SAVE
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// UPDATE STATS
function updateStats() {
  document.getElementById("focusTime").innerText = totalFocus;
  document.getElementById("tasksDone").innerText = tasksDone;
  loadChart();
}

// ✅ FIXED SMART SUGGESTION (PRIORITY + TIME)
function getSuggestion() {
  let outputBox = document.getElementById("aiOutput");

  if (tasks.length === 0) {
    outputBox.innerText = "Add tasks first!";
    return;
  }

  let pending = tasks.filter(t => !t.done);

  if (pending.length === 0) {
    outputBox.innerText = "All tasks completed 🎉";
    return;
  }

  let priorityMap = { High: 3, Medium: 2, Low: 1 };

  // 🔥 FIXED SORT (single combined logic)
  pending.sort((a, b) => {
    let priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];

    if (priorityDiff !== 0) {
      return priorityDiff; // Higher priority first
    }

    return a.work - b.work; // If same priority → shorter task first
  });

  let next = pending[0];

  let efficiency = totalFocus / (tasksDone || 1);

  let suggestion = `👉 Start "${next.text}" for ${next.work} minutes.\n`;

  if (next.work > 50) {
    suggestion += "⚡ Break into smaller sessions.\n";
  }

  if (efficiency < 20) {
    suggestion += "💡 Try shorter focus sessions.\n";
  } else {
    suggestion += "🔥 Try deep focus session.\n";
  }

  suggestion += "🚀 Stay consistent!";

  document.getElementById("aiOutput").innerText = suggestion;
}

// CHART
function loadChart() {
  if (focusChart) focusChart.destroy();

  focusChart = new Chart(document.getElementById("focusChart"), {
    type: "bar",
    data: {
      labels: ["Focus Time", "Tasks Done"],
      datasets: [{
        label: "Your Productivity",
        data: [totalFocus, tasksDone]
      }]
    }
  });
}

// INIT
updateDisplay();
renderTasks();
updateStats();