// Access elements
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');

// Unique ID generator helper for tasks
function generateID() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Current tasks storage in memory
// Structure: {id, title, description, isCompleted:boolean, createdAt:Date, completedAt:Date|null}
let tasks = [];

// Save tasks to localStorage for persistence
function saveTasks() {
    localStorage.setItem('todoAppTasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
    const stored = localStorage.getItem('todoAppTasks');
    if (stored) {
        try {
            let parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                // Convert stored string timestamps back to Date objects
                tasks = parsed.map(t => ({
                    ...t,
                    createdAt: new Date(t.createdAt),
                    completedAt: t.completedAt ? new Date(t.completedAt) : null
                }));
            }
        } catch (e) {
            console.error('Failed to parse saved tasks data.', e);
            tasks = [];
        }
    }
}

// Format date/time as YYYY-MM-DD HH:MM (24hr)
function formatDateTime(date) {
    if (!(date instanceof Date)) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
}

// Render all tasks - split between pending and completed
function renderTasks() {
    // Clear containers
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    // Filter and render pending tasks
    tasks.filter(t => !t.isCompleted).forEach(task => {
        const el = createTaskElement(task);
        pendingList.appendChild(el);
    });

    // Filter and render completed tasks
    tasks.filter(t => t.isCompleted).forEach(task => {
        const el = createTaskElement(task);
        completedList.appendChild(el);
    });

    // Show placeholders if no tasks
    if (pendingList.children.length === 0) {
        pendingList.innerHTML = '<p style="color:#ccc; font-style:italic; user-select:none;">No pending tasks</p>';
    }
    if (completedList.children.length === 0) {
        completedList.innerHTML = '<p style="color:#ccc; font-style:italic; user-select:none;">No completed tasks</p>';
    }
}

// Create task HTML element with buttons and handlers
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-card' + (task.isCompleted ? ' completed' : '');
    taskDiv.setAttribute('data-id', task.id);
    taskDiv.setAttribute('role', 'listitem');
    taskDiv.tabIndex = 0;

    // Title and description container or editable inputs
    const contentContainer = document.createElement('div');
    contentContainer.style.gridColumn = '1 / 3';
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.gap = '3px';

    // Initially non-edit mode with text spans
    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;

    const descSpan = document.createElement('span');
    descSpan.className = 'task-desc';
    descSpan.textContent = task.description;

    contentContainer.appendChild(titleSpan);
    contentContainer.appendChild(descSpan);

    // Created date display
    const createdDate = document.createElement('div');
    createdDate.className = 'task-datetime';
    createdDate.textContent = 'Added: ' + formatDateTime(task.createdAt);

    // Completed date display (only for completed tasks)
    const completedDate = document.createElement('div');
    completedDate.className = 'task-datetime';
    completedDate.style.justifySelf = 'start';
    if (task.isCompleted && task.completedAt) {
        completedDate.textContent = 'Completed: ' + formatDateTime(task.completedAt);
    }

    // Buttons container
    // We create these as buttons for accessibility
    const btnComplete = document.createElement('button');
    btnComplete.className = 'task-btn btn-complete';
    btnComplete.type = 'button';
    btnComplete.setAttribute('aria-label', task.isCompleted ? 'Mark task as pending' : 'Mark task as complete');
    btnComplete.textContent = task.isCompleted ? '⟳' : '✓';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'task-btn btn-edit';
    btnEdit.type = 'button';
    btnEdit.setAttribute('aria-label', 'Edit task');
    btnEdit.textContent = '✎';

    const btnDelete = document.createElement('button');
    btnDelete.className = 'task-btn btn-delete';
    btnDelete.type = 'button';
    btnDelete.setAttribute('aria-label', 'Delete task');
    btnDelete.textContent = '✕';

    // Grid positioning: title/desc span 1-2 columns, createdDate col 3,
    // completedDate col 4, buttons col 5 (we combine buttons in one grid column)
    // We add complete, edit and delete buttons side by side within this grid column
    // So we have 5 columns, last column is a flex container with buttons horizontally
    taskDiv.style.display = 'grid';
    taskDiv.style.gridTemplateColumns = '1fr 2.5fr 1.2fr 1.2fr 1.6fr';
    taskDiv.style.alignItems = 'center';
    taskDiv.style.gap = '12px';

    // Remove old children if any
    while (taskDiv.firstChild) taskDiv.removeChild(taskDiv.firstChild);
    taskDiv.appendChild(titleSpan);
    taskDiv.appendChild(descSpan);
    taskDiv.appendChild(createdDate);
    taskDiv.appendChild(completedDate);

    // Buttons container with flex styling
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.style.display = 'flex';
    buttonsWrapper.style.gap = '8px';
    buttonsWrapper.style.justifyContent = 'flex-end';

    buttonsWrapper.appendChild(btnComplete);
    buttonsWrapper.appendChild(btnEdit);
    buttonsWrapper.appendChild(btnDelete);
    taskDiv.appendChild(buttonsWrapper);

    // Button event handlers

    btnComplete.addEventListener('click', () => {
        toggleTaskCompletion(task.id);
    });

    btnDelete.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete task:\n"${task.title}"?`)) {
            deleteTask(task.id);
        }
    });

    btnEdit.addEventListener('click', () => {
        setTaskEditable(taskDiv, task);
    });

    // Return the constructed task element
    return taskDiv;
}

// Toggle task completion state and update completedAt accordingly
function toggleTaskCompletion(taskId) {
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    tasks[idx].isCompleted = !tasks[idx].isCompleted;
    if (tasks[idx].isCompleted) {
        tasks[idx].completedAt = new Date();
    } else {
        tasks[idx].completedAt = null;
    }
    saveTasks();
    renderTasks();
}

// Delete task and rerender
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
}

// Set task card to editable state with inputs; allow cancel/save
function setTaskEditable(taskDiv, task) {
    // Replace title and desc spans with text inputs
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'edit-input';
    titleInput.value = task.title;
    titleInput.setAttribute('aria-label', 'Edit task title');
    titleInput.required = true;

    const descInput = document.createElement('textarea');
    descInput.className = 'edit-input';
    descInput.value = task.description;
    descInput.rows = 2;
    descInput.setAttribute('aria-label', 'Edit task description');
    descInput.required = true;

    const btnSave = document.createElement('button');
    btnSave.className = 'task-btn btn-complete';
    btnSave.textContent = 'Save';
    btnSave.type = 'button';
    btnSave.setAttribute('aria-label', 'Save edited task');

    const btnCancel = document.createElement('button');
    btnCancel.className = 'task-btn btn-delete';
    btnCancel.textContent = 'Cancel';
    btnCancel.type = 'button';
    btnCancel.setAttribute('aria-label', 'Cancel editing');

    while (taskDiv.firstChild) taskDiv.removeChild(taskDiv.firstChild);

    taskDiv.style.gridTemplateColumns = '1fr 2.5fr 1.2fr 1.2fr 1.6fr';

    taskDiv.appendChild(titleInput);
    taskDiv.appendChild(descInput);

    const createdDate = document.createElement('div');
    createdDate.className = 'task-datetime';
    createdDate.textContent = 'Added: ' + formatDateTime(task.createdAt);
    taskDiv.appendChild(createdDate);

    const completedDate = document.createElement('div');
    completedDate.className = 'task-datetime';
    if (task.isCompleted && task.completedAt) {
        completedDate.textContent = 'Completed: ' + formatDateTime(task.completedAt);
    }
    taskDiv.appendChild(completedDate);

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.style.display = 'flex';
    buttonsWrapper.style.gap = '8px';
    buttonsWrapper.style.justifyContent = 'flex-end';
    buttonsWrapper.appendChild(btnSave);
    buttonsWrapper.appendChild(btnCancel);
    taskDiv.appendChild(buttonsWrapper);

    titleInput.focus();

    btnCancel.addEventListener('click', () => {
        renderTasks();
    });

    btnSave.addEventListener('click', () => {
        const newTitle = titleInput.value.trim();
        const newDesc = descInput.value.trim();
        if (newTitle === '') {
            alert('Title cannot be empty.');
            titleInput.focus();
            return;
        }
        if (newDesc === '') {
            alert('Description cannot be empty.');
            descInput.focus();
            return;
        }
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx === -1) return;
        tasks[idx].title = newTitle;
        tasks[idx].description = newDesc;
        saveTasks();
        renderTasks();
    });
}

taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (title === '') {
        alert('Please enter a task title.');
        titleInput.focus();
        return;
    }

    if (description === '') {
        alert('Please enter a task description.');
        descInput.focus();
        return;
    }

    const newTask = {
        id: generateID(),
        title,
        description,
        isCompleted: false,
        createdAt: new Date(),
        completedAt: null,
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
    titleInput.focus();
});

function init() {
    loadTasks();
    renderTasks();
}

document.addEventListener('DOMContentLoaded', init);