// DOM Elements
const processTableBody = document.getElementById('processTableBody');
const addProcessBtn = document.getElementById('addProcessBtn');
const generateRandomBtn = document.getElementById('generateRandomBtn');
const clearProcessesBtn = document.getElementById('clearProcessesBtn');
const algoOptions = document.querySelectorAll('.algo-option');
const timeQuantumContainer = document.getElementById('timeQuantumContainer');
const timeQuantumInput = document.getElementById('timeQuantum');
const simulateBtn = document.getElementById('simulateBtn');
const compareBtn = document.getElementById('compareBtn');
const ganttChart = document.getElementById('ganttChart');
const avgWaitingTime = document.getElementById('avgWaitingTime');
const avgTurnaroundTime = document.getElementById('avgTurnaroundTime');
const avgResponseTime = document.getElementById('avgResponseTime');
const cpuUtilization = document.getElementById('cpuUtilization');
const comparisonCard = document.getElementById('comparisonCard');
const comparisonTableBody = document.getElementById('comparisonTableBody');

// State management
let selectedAlgorithm = null;
let processCounter = 4; // Start from P4 since we have 3 initial processes

// Event Listeners
addProcessBtn.addEventListener('click', addNewProcess);
generateRandomBtn.addEventListener('click', generateRandomProcesses);
clearProcessesBtn.addEventListener('click', clearAllProcesses);

// Algorithm selection
algoOptions.forEach(option => {
    option.addEventListener('click', () => {
        algoOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedAlgorithm = option.dataset.algo;

        // Show time quantum input only for Round Robin
        if (selectedAlgorithm === 'roundRobin') {
            timeQuantumContainer.style.display = 'block';
        } else {
            timeQuantumContainer.style.display = 'none';
        }
    });
});

// Simulate button
simulateBtn.addEventListener('click', () => {
    if (!selectedAlgorithm) {
        alert('Please select an algorithm first!');
        return;
    }

    const processes = getProcessesFromTable();
    if (processes.length === 0) {
        alert('Please add at least one process!');
        return;
    }

    // Hide comparison card if showing
    comparisonCard.style.display = 'none';

    // Run the selected algorithm
    let results;
    switch (selectedAlgorithm) {
        case 'fcfs':
            results = fcfs(processes);
            break;
        case 'sjf':
            results = sjf(processes);
            break;
        case 'priority':
            results = priorityScheduling(processes);
            break;
        case 'roundRobin':
            const timeQuantum = parseInt(timeQuantumInput.value) || 2;
            results = roundRobin(processes, timeQuantum);
            break;
        case 'srtf':
            results = srtf(processes);
            break;
        default:
            alert('Invalid algorithm selection!');
            return;
    }

    // Render results
    renderGanttChart(results.gantt);
    updateMetrics(results.metrics);
});

// Compare button
compareBtn.addEventListener('click', () => {
    const processes = getProcessesFromTable();
    if (processes.length === 0) {
        alert('Please add at least one process!');
        return;
    }

    // Run all algorithms
    const timeQuantum = parseInt(timeQuantumInput.value) || 2;
    const fcfsResults = fcfs(processes);
    const sjfResults = sjf(processes);
    const priorityResults = priorityScheduling(processes);
    const rrResults = roundRobin(processes, timeQuantum);
    const srtfResults = srtf(processes);

    // Render comparison table
    comparisonTableBody.innerHTML = '';

    addComparisonRow('FCFS', fcfsResults.metrics);
    addComparisonRow('SJF', sjfResults.metrics);
    addComparisonRow('Priority', priorityResults.metrics);
    addComparisonRow('Round Robin (TQ=' + timeQuantum + ')', rrResults.metrics);
    addComparisonRow('SRTF', srtfResults.metrics);

    // Show comparison card
    comparisonCard.style.display = 'block';
});

// Helper functions
function addNewProcess() {
    const newRow = document.createElement('tr');
    newRow.id = `process-row-${processCounter}`;
    newRow.innerHTML = `
        <td>P${processCounter}</td>
        <td><input type="number" class="arrival-time" min="0" value="0"></td>
        <td><input type="number" class="burst-time" min="1" value="5"></td>
        <td><input type="number" class="priority" min="1" value="1"></td>
        <td>
            <button class="btn btn-danger delete-process">Delete</button>
        </td>
    `;
    processTableBody.appendChild(newRow);
    processCounter++;
}

function generateRandomProcesses() {
    const numProcesses = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < numProcesses; i++) {
        const newRow = document.createElement('tr');
        newRow.id = `process-row-${processCounter}`;
        newRow.innerHTML = `
            <td>P${processCounter}</td>
            <td><input type="number" class="arrival-time" min="0" value="${Math.floor(Math.random() * 10)}"></td>
            <td><input type="number" class="burst-time" min="1" value="${Math.floor(Math.random() * 10) + 1}"></td>
            <td><input type="number" class="priority" min="1" value="${Math.floor(Math.random() * 10) + 1}"></td>
            <td>
                <button class="btn btn-danger delete-process">Delete</button>
            </td>
        `;
        processTableBody.appendChild(newRow);
        processCounter++;
    }
}

function clearAllProcesses() {
    processTableBody.innerHTML = '';
    processCounter = 4;
}

function getProcessesFromTable() {
    const processes = [];
    const rows = processTableBody.children;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const arrivalTime = parseInt(row.querySelector('.arrival-time').value);
        const burstTime = parseInt(row.querySelector('.burst-time').value);
        const priority = parseInt(row.querySelector('.priority').value);
        processes.push({ arrivalTime, burstTime, priority });
    }
    return processes;
}

function renderGanttChart(gantt) {
    ganttChart.innerHTML = '';
    for (let i = 0; i < gantt.length; i++) {
        const process = gantt[i];
        const bar = document.createElement('div');
        bar.classList.add('gantt-bar');
        bar.style.width = `${process.duration}px`;
        bar.style.background = `var(--${process.color})`;
        bar.innerHTML = `
            <span class="gantt-time">${process.startTime}</span>
            <span class="gantt-process">${process.name}</span>
        `;
        ganttChart.appendChild(bar);
    }
}

function updateMetrics(metrics) {
    avgWaitingTime.textContent = metrics.avgWaitingTime.toFixed(2);
    avgTurnaroundTime.textContent = metrics.avgTurnaroundTime.toFixed(2);
    avgResponseTime.textContent = metrics.avgResponseTime.toFixed(2);
    cpuUtilization.textContent = `${metrics.cpuUtilization.toFixed(2)}%`;
}

function addComparisonRow(algorithm, metrics) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${algorithm}</td>
        <td>${metrics.avgWaitingTime.toFixed(2)}</td>
        <td>${metrics.avgTurnaroundTime.toFixed(2)}</td>
        <td>${metrics.avgResponseTime.toFixed(2)}</td>
        <td>${metrics.cpuUtilization.toFixed(2)}%</td>
    `;
    comparisonTableBody.appendChild(row);
}

// Algorithm implementations
function fcfs(processes) {
    const gantt = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    for (let i = 0; i < processes.length; i++) {
        const process = processes[i];
        const arrivalTime = process.arrivalTime;
        const burstTime = process.burstTime;
        const startTime = Math.max(currentTime, arrivalTime);
        const endTime = startTime + burstTime;

        gantt.push({ name: `P${i + 1}`, startTime, endTime, duration: burstTime, color: 'primary' });

        currentTime = endTime;

        // Calculate waiting time and turnaround time
        const waitingTime = startTime - arrivalTime;
        const turnaroundTime = waitingTime + burstTime;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
    }

    const metrics = calculateMetrics(totalWaitingTime, totalTurnaroundTime, processes.length);
    return { gantt, metrics };
}

function sjf(processes) {
    const gantt = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    processes.sort((a, b) => a.burstTime - b.burstTime);

    for (let i = 0; i < processes.length; i++) {
        const process = processes[i];
        const arrivalTime = process.arrivalTime;
        const burstTime = process.burstTime;
        const startTime = Math.max(currentTime, arrivalTime);
        const endTime = startTime + burstTime;

        gantt.push({ name: `P${i + 1}`, startTime, endTime, duration: burstTime, color: 'success' });

        currentTime = endTime;

        // Calculate waiting time and turnaround time
        const waitingTime = startTime - arrivalTime;
        const turnaroundTime = waitingTime + burstTime;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
    }

    const metrics = calculateMetrics(totalWaitingTime, totalTurnaroundTime, processes.length);
    return { gantt, metrics };
}

function priorityScheduling(processes) {
    const gantt = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    processes.sort((a, b) => a.priority - b.priority);

    for (let i = 0; i < processes.length; i++) {
        const process = processes[i];
        const arrivalTime = process.arrivalTime;
        const burstTime = process.burstTime;
        const startTime = Math.max(currentTime, arrivalTime);
        const endTime = startTime + burstTime;

        gantt.push({ name: `P${i + 1}`, startTime, endTime, duration: burstTime, color: 'warning' });

        currentTime = endTime;

        // Calculate waiting time and turnaround time
        const waitingTime = startTime - arrivalTime;
        const turnaroundTime = waitingTime + burstTime;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
    }

    const metrics = calculateMetrics(totalWaitingTime, totalTurnaroundTime, processes.length);
    return { gantt, metrics };
}

function roundRobin(processes, timeQuantum) {
    const gantt = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let readyQueue = [...processes];

    while (readyQueue.length > 0) {
        const process = readyQueue.shift();
        const arrivalTime = process.arrivalTime;
        const burstTime = process.burstTime;
        const startTime = Math.max(currentTime, arrivalTime);
        const timeSpent = Math.min(timeQuantum, burstTime);
        const endTime = startTime + timeSpent;

        gantt.push({ name: `P${processCounter}`, startTime, endTime, duration: timeSpent, color: 'info' });

        currentTime = endTime;

        // Calculate waiting time and turnaround time
        const waitingTime = startTime - arrivalTime;
        const turnaroundTime = waitingTime + timeSpent;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;

        if (burstTime > timeQuantum) {
            readyQueue.push({ arrivalTime: endTime, burstTime: burstTime - timeQuantum, priority: process.priority });
        }
    }

    const metrics = calculateMetrics(totalWaitingTime, totalTurnaroundTime, processes.length);
    return { gantt, metrics };
}

function srtf(processes) {
    // Implementation for Shortest Remaining Time First
    // This function needs to be implemented similarly to the others
}

function calculateMetrics(totalWaitingTime, totalTurnaroundTime, processCount) {
    const avgWaitingTime = totalWaitingTime / processCount;
    const avgTurnaroundTime = totalTurnaroundTime / processCount;
    const avgResponseTime = avgWaitingTime; // For simplicity, assuming response time equals waiting time
    const cpuUtilization = (totalTurnaroundTime / (totalTurnaroundTime + totalWaitingTime)) * 100;

    return {
        avgWaitingTime,
        avgTurnaroundTime,
        avgResponseTime,
        cpuUtilization
    };
}