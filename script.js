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

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

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
simulateBtn.addEventListener('click', async () => {
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

    try {
        const response = await fetch(`${API_BASE_URL}/simulate/${selectedAlgorithm}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                processes: processes.map(p => ({
                    arrivalTime: p.arrivalTime,
                    burstTime: p.burstTime,
                    priority: p.priority
                })),
                timeQuantum: parseInt(timeQuantumInput.value) || 2
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        
        // Render results
        renderGanttChart(results.gantt);
        updateMetrics(results.metrics);

        // Save processes to backend
        await saveProcessesToBackend(processes);

    } catch (error) {
        console.error('Error during simulation:', error);
        alert('Failed to run simulation. Check console for details.');
    }
});

// Compare button
compareBtn.addEventListener('click', async () => {
    const processes = getProcessesFromTable();
    if (processes.length === 0) {
        alert('Please add at least one process!');
        return;
    }

    try {
        // Save processes first
        await saveProcessesToBackend(processes);

        // Run all algorithms
        const timeQuantum = parseInt(timeQuantumInput.value) || 2;
        
        const algorithms = [
            { name: 'FCFS', endpoint: 'fcfs' },
            { name: 'SJF', endpoint: 'sjf' },
            { name: 'Priority', endpoint: 'priority' },
            { name: 'Round Robin', endpoint: 'roundRobin', timeQuantum: true },
            { name: 'SRTF', endpoint: 'srtf' }
        ];

        comparisonTableBody.innerHTML = '';

        for (const algo of algorithms) {
            const body = {
                processes: processes.map(p => ({
                    arrivalTime: p.arrivalTime,
                    burstTime: p.burstTime,
                    priority: p.priority
                }))
            };

            if (algo.timeQuantum) {
                body.timeQuantum = timeQuantum;
            }

            const response = await fetch(`${API_BASE_URL}/simulate/${algo.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.error(`Failed to get results for ${algo.name}`);
                continue;
            }

            const results = await response.json();
            const displayName = algo.timeQuantum 
                ? `${algo.name} (TQ=${timeQuantum})` 
                : algo.name;
            
            addComparisonRow(displayName, results.metrics);
        }

        // Show comparison card
        comparisonCard.style.display = 'block';

    } catch (error) {
        console.error('Error during comparison:', error);
        alert('Failed to compare algorithms. Check console for details.');
    }
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
    
    // Add event listener for delete button
    newRow.querySelector('.delete-process').addEventListener('click', () => {
        newRow.remove();
    });
    
    processCounter++;
}

async function generateRandomProcesses() {
    try {
        const count = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(`${API_BASE_URL}/processes/random`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ count })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Clear existing processes
        processTableBody.innerHTML = '';
        processCounter = 1;
        
        // Add new random processes
        data.processes.forEach((process, index) => {
            const newRow = document.createElement('tr');
            newRow.id = `process-row-${processCounter}`;
            newRow.innerHTML = `
                <td>P${processCounter}</td>
                <td><input type="number" class="arrival-time" min="0" value="${process.arrivalTime}"></td>
                <td><input type="number" class="burst-time" min="1" value="${process.burstTime}"></td>
                <td><input type="number" class="priority" min="1" value="${process.priority}"></td>
                <td>
                    <button class="btn btn-danger delete-process">Delete</button>
                </td>
            `;
            processTableBody.appendChild(newRow);
            
            // Add event listener for delete button
            newRow.querySelector('.delete-process').addEventListener('click', () => {
                newRow.remove();
            });
            
            processCounter++;
        });

    } catch (error) {
        console.error('Error generating random processes:', error);
        alert('Failed to generate random processes. Check console for details.');
    }
}

async function clearAllProcesses() {
    try {
        const response = await fetch(`${API_BASE_URL}/processes/clear`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        processTableBody.innerHTML = '';
        processCounter = 1;
        
    } catch (error) {
        console.error('Error clearing processes:', error);
        alert('Failed to clear processes. Check console for details.');
    }
}

async function saveProcessesToBackend(processes) {
    try {
        const response = await fetch(`${API_BASE_URL}/processes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ processes })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

    } catch (error) {
        console.error('Error saving processes:', error);
    }
}

function getProcessesFromTable() {
    const processes = [];
    const rows = processTableBody.children;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const arrivalTime = parseInt(row.querySelector('.arrival-time').value);
        const burstTime = parseInt(row.querySelector('.burst-time').value);
        const priority = parseInt(row.querySelector('.priority').value);
        processes.push({ 
            id: row.id.replace('process-row-', ''),
            arrivalTime, 
            burstTime, 
            priority 
        });
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

// Initialize the table with delete button event listeners
document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-process');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('tr').remove();
        });
    });
});