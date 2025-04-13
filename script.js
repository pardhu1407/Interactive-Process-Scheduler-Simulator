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

// Mock API functions (replace with actual API calls in production)
const API = {
    simulate: async (algorithm, processes, timeQuantum = 2) => {
        // This is a mock implementation - replace with actual API call
        console.log(`Simulating ${algorithm} with`, processes, `Time Quantum: ${timeQuantum}`);
        
        // Mock delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate mock results based on the algorithm
        return generateMockResults(algorithm, processes, timeQuantum);
    },
    
    generateRandomProcesses: async (count) => {
        // Mock implementation - generates random processes
        const processes = [];
        for (let i = 0; i < count; i++) {
            processes.push({
                arrivalTime: Math.floor(Math.random() * 10),
                burstTime: Math.floor(Math.random() * 10) + 1,
                priority: Math.floor(Math.random() * 5) + 1
            });
        }
        return { processes };
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize delete button event listeners for initial processes
    document.querySelectorAll('.delete-process').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('tr').remove();
        });
    });
});

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
        timeQuantumContainer.style.display = selectedAlgorithm === 'roundRobin' ? 'block' : 'none';
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

    // Show loading state
    simulateBtn.disabled = true;
    simulateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating...';

    try {
        const results = await API.simulate(
            selectedAlgorithm, 
            processes,
            selectedAlgorithm === 'roundRobin' ? parseInt(timeQuantumInput.value) || 2 : undefined
        );
        
        // Render results
        renderGanttChart(results.gantt);
        updateMetrics(results.metrics);

    } catch (error) {
        console.error('Error during simulation:', error);
        alert('Simulation failed. Check console for details.');
    } finally {
        // Reset button state
        simulateBtn.disabled = false;
        simulateBtn.innerHTML = '<i class="fas fa-play"></i> Simulate';
    }
});

// Compare button
compareBtn.addEventListener('click', async () => {
    const processes = getProcessesFromTable();
    if (processes.length === 0) {
        alert('Please add at least one process!');
        return;
    }

    // Show loading state
    compareBtn.disabled = true;
    compareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Comparing...';

    try {
        comparisonTableBody.innerHTML = '';
        
        const algorithms = [
            { name: 'FCFS', endpoint: 'fcfs' },
            { name: 'SJF', endpoint: 'sjf' },
            { name: 'Priority', endpoint: 'priority' },
            { name: 'Round Robin', endpoint: 'roundRobin', timeQuantum: true },
            { name: 'SRTF', endpoint: 'srtf' }
        ];

        for (const algo of algorithms) {
            const results = await API.simulate(
                algo.endpoint,
                processes,
                algo.timeQuantum ? parseInt(timeQuantumInput.value) || 2 : undefined
            );
            
            addComparisonRow(algo.name, results.metrics);
        }

        // Show comparison card
        comparisonCard.style.display = 'block';

    } catch (error) {
        console.error('Error during comparison:', error);
        alert('Comparison failed. Check console for details.');
    } finally {
        // Reset button state
        compareBtn.disabled = false;
        compareBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Compare All';
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
            <button class="btn btn-danger btn-sm delete-process">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    processTableBody.appendChild(newRow);
    
    // Add event listener for delete button
    newRow.querySelector('.delete-process').addEventListener('click', function() {
        newRow.remove();
    });
    
    processCounter++;
}

async function generateRandomProcesses() {
    try {
        const count = Math.floor(Math.random() * 5) + 3; // 3-7 random processes
        const { processes } = await API.generateRandomProcesses(count);
        
        // Clear existing processes
        processTableBody.innerHTML = '';
        processCounter = 1;
        
        // Add new random processes
        processes.forEach(process => {
            const newRow = document.createElement('tr');
            newRow.id = `process-row-${processCounter}`;
            newRow.innerHTML = `
                <td>P${processCounter}</td>
                <td><input type="number" class="arrival-time" min="0" value="${process.arrivalTime}"></td>
                <td><input type="number" class="burst-time" min="1" value="${process.burstTime}"></td>
                <td><input type="number" class="priority" min="1" value="${process.priority}"></td>
                <td>
                    <button class="btn btn-danger btn-sm delete-process">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            processTableBody.appendChild(newRow);
            
            // Add event listener for delete button
            newRow.querySelector('.delete-process').addEventListener('click', function() {
                newRow.remove();
            });
            
            processCounter++;
        });

    } catch (error) {
        console.error('Error generating random processes:', error);
        alert('Failed to generate random processes.');
    }
}

function clearAllProcesses() {
    processTableBody.innerHTML = '';
    processCounter = 1;
    
    // Add back the default empty state or initial processes if needed
    addNewProcess();
    addNewProcess();
    addNewProcess();
}

function getProcessesFromTable() {
    const processes = [];
    const rows = processTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const arrivalTime = parseInt(row.querySelector('.arrival-time').value);
        const burstTime = parseInt(row.querySelector('.burst-time').value);
        const priority = parseInt(row.querySelector('.priority').value);
        
        processes.push({ 
            id: row.id.replace('process-row-', ''),
            arrivalTime, 
            burstTime, 
            priority 
        });
    });
    
    return processes;
}

function renderGanttChart(ganttData) {
    ganttChart.innerHTML = '';
    
    if (!ganttData || ganttData.length === 0) {
        ganttChart.innerHTML = '<div class="no-data">No Gantt chart data available</div>';
        return;
    }
    
    // Calculate total duration for scaling
    const totalDuration = ganttData[ganttData.length - 1].endTime;
    const containerWidth = ganttChart.offsetWidth;
    const scale = containerWidth / totalDuration;
    
    ganttData.forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        
        // Scale the width based on duration
        const width = Math.max(60, item.duration * scale);
        bar.style.width = `${width}px`;
        
        // Assign different colors for different processes
        const hue = (parseInt(item.name.substring(1)) * 137.508) % 360; // Golden angle for colors
        bar.style.background = `hsl(${hue}, 70%, 60%)`;
        
        bar.innerHTML = `
            <span class="gantt-process">${item.name}</span>
            <span class="gantt-time">${item.startTime}-${item.endTime}</span>
        `;
        
        ganttChart.appendChild(bar);
    });
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

// Mock result generator for demonstration
function generateMockResults(algorithm, processes, timeQuantum = 2) {
    // Sort processes based on algorithm
    let sortedProcesses = [...processes];
    
    switch(algorithm) {
        case 'fcfs':
            sortedProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
            break;
        case 'sjf':
            sortedProcesses.sort((a, b) => a.burstTime - b.burstTime);
            break;
        case 'priority':
            sortedProcesses.sort((a, b) => a.priority - b.priority);
            break;
        case 'roundRobin':
            // For RR, we'll simulate time slices
            break;
        case 'srtf':
            sortedProcesses.sort((a, b) => (a.burstTime - a.executed) - (b.burstTime - b.executed));
            break;
    }
    
    // Generate mock Gantt chart
    const gantt = [];
    let currentTime = 0;
    
    if (algorithm === 'roundRobin') {
        // Round Robin simulation
        let remainingProcesses = processes.map(p => ({
            ...p,
            remainingTime: p.burstTime
        }));
        
        while (remainingProcesses.some(p => p.remainingTime > 0)) {
            for (const process of remainingProcesses) {
                if (process.remainingTime > 0) {
                    const executionTime = Math.min(timeQuantum, process.remainingTime);
                    gantt.push({
                        name: `P${process.id}`,
                        startTime: currentTime,
                        endTime: currentTime + executionTime,
                        duration: executionTime
                    });
                    currentTime += executionTime;
                    process.remainingTime -= executionTime;
                }
            }
        }
    } else {
        // Other algorithms (simplified simulation)
        for (const process of sortedProcesses) {
            gantt.push({
                name: `P${process.id}`,
                startTime: currentTime,
                endTime: currentTime + process.burstTime,
                duration: process.burstTime
            });
            currentTime += process.burstTime;
        }
    }
    
    // Calculate mock metrics
    const totalProcesses = processes.length;
    const totalWaitingTime = processes.reduce((sum, p) => sum + Math.max(0, currentTime - p.arrivalTime - p.burstTime), 0);
    const totalTurnaroundTime = processes.reduce((sum, p) => sum + (currentTime - p.arrivalTime), 0);
    const totalResponseTime = processes.reduce((sum, p) => sum + (p.arrivalTime === 0 ? 0 : Math.random() * 5), 0);
    
    return {
        gantt,
        metrics: {
            avgWaitingTime: totalWaitingTime / totalProcesses,
            avgTurnaroundTime: totalTurnaroundTime / totalProcesses,
            avgResponseTime: totalResponseTime / totalProcesses,
            cpuUtilization: (currentTime / (currentTime + 5)) * 100 // Add some idle time
        }
    };
}
