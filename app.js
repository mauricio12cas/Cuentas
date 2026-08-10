// App State Management for Registro de Cafeterías - Minimalist & Direct Click Toggle

// Configuration Constants
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// App State
let state = {
  weeks: [],        // Array of week objects: { id: 'YYYY-MM-DD', title: '3 agosto - 8 agosto', entries: [] }
  activeWeekId: '',  // Current week ID
  cafeterias: []    // List of unique cafeteria names
};

// --- Helper Functions ---

function generateUUID() {
  return 'entry_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

function parseLocalDate(dateStr) {
  const parts = dateStr.split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateToISO(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Calculate Monday to Saturday range
function getWeekRange(dateObj) {
  const tempDate = new Date(dateObj);
  const day = tempDate.getDay();
  const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(tempDate.setDate(diff));
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  
  const mondayStr = `${monday.getDate()} ${MONTHS[monday.getMonth()]}`;
  const saturdayStr = `${saturday.getDate()} ${MONTHS[saturday.getMonth()]}`;
  
  return {
    id: formatDateToISO(monday),
    title: `${mondayStr} - ${saturdayStr}`,
    year: monday.getFullYear(),
    mondayDate: monday,
    saturdayDate: saturday
  };
}

// Get today's date formatted as "Lunes 10 Ago"
function getFormattedToday() {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const today = new Date();
  const dayName = days[today.getDay()];
  const dayNum = today.getDate();
  const monthName = months[today.getMonth()];
  return `${dayName} ${dayNum} ${monthName}`;
}

// Calculate the 6 days of the active week
function getDaysOfActiveWeek() {
  const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
  if (!activeWeek) return [];
  
  const monday = parseLocalDate(activeWeek.id);
  const daysList = [];
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthAbbrs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  for (let i = 0; i < 6; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dayName = dayNames[i];
    const dayNum = dayDate.getDate();
    const monthName = monthAbbrs[dayDate.getMonth()];
    daysList.push(`${dayName} ${dayNum} ${monthName}`);
  }
  return daysList;
}

// --- Local Storage Management ---

function loadStateFromLocalStorage() {
  const savedData = localStorage.getItem('cafeterias_accounts_data');
  const requiredCafeterias = ["Cafe Del Sur", "Amïn", "Breck", "Zuzu", "Charcuteri", "Gertrudis"];
  
  if (savedData) {
    try {
      state = JSON.parse(savedData);
      
      // Reset if old test data is found
      const hasOldTestData = state.weeks.some(w => 
        w.entries.some(e => e.cafeteria === "Cafetería Central" || e.cafeteria === "Coffee Shakers")
      ) || (state.cafeterias && state.cafeterias.includes("Espresso Bar"));
      
      if (hasOldTestData) {
        initEmptyState();
        return;
      }
      
      if (!state.weeks) state.weeks = [];
      if (!state.cafeterias) state.cafeterias = [];
      
      // Auto-migrate: ensure the 6 required cafeterias are in the list
      let modified = false;
      requiredCafeterias.forEach(cafeteria => {
        if (!state.cafeterias.includes(cafeteria)) {
          state.cafeterias.push(cafeteria);
          modified = true;
        }
      });
      
      if (modified) {
        state.cafeterias.sort();
        saveStateToLocalStorage();
      }
      
      rebuildCafeteriasList();
    } catch (e) {
      console.error("Error reading localStorage", e);
      initEmptyState();
    }
  } else {
    initEmptyState();
  }
}

function initEmptyState() {
  state.weeks = [];
  state.cafeterias = ["Cafe Del Sur", "Amïn", "Breck", "Zuzu", "Charcuteri", "Gertrudis"].sort();
  
  const today = new Date();
  const currentWeek = getWeekRange(today);
  
  state.weeks.push({
    id: currentWeek.id,
    title: currentWeek.title,
    year: currentWeek.year,
    entries: []
  });
  
  state.activeWeekId = currentWeek.id;
  saveStateToLocalStorage();
}

function saveStateToLocalStorage() {
  localStorage.setItem('cafeterias_accounts_data', JSON.stringify(state));
}

function rebuildCafeteriasList() {
  if (!state.cafeterias) state.cafeterias = [];
  const names = new Set(state.cafeterias);
  
  state.weeks.forEach(w => {
    w.entries.forEach(e => {
      if (e.cafeteria && e.cafeteria.trim()) {
        names.add(e.cafeteria.trim());
      }
    });
  });
  
  state.cafeterias = Array.from(names).sort();
}

// --- DOM Rendering & Controller Functions ---

function renderWeeksList() {
  const dropdown = document.getElementById('week-dropdown');
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  const sortedWeeks = [...state.weeks].sort((a, b) => b.id.localeCompare(a.id));
  
  if (sortedWeeks.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = "Sin semanas";
    opt.value = "";
    dropdown.appendChild(opt);
    return;
  }
  
  sortedWeeks.forEach(week => {
    const opt = document.createElement('option');
    opt.value = week.id;
    opt.textContent = `${week.title} (${week.year})`;
    if (week.id === state.activeWeekId) {
      opt.selected = true;
    }
    dropdown.appendChild(opt);
  });
}

function renderActiveWeekSheet() {
  const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
  const activeWeekLabel = document.getElementById('active-week-label');
  const activeWeekSpan = document.getElementById('active-week-span');
  const entriesBody = document.getElementById('sheet-entries');
  const emptyState = document.getElementById('table-empty-state');
  
  if (!activeWeek) {
    if (activeWeekLabel) activeWeekLabel.textContent = "Selecciona una semana";
    if (activeWeekSpan) activeWeekSpan.textContent = "Semana no seleccionada";
    if (entriesBody) entriesBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    updateStatsCards(0, 0, 0);
    return;
  }
  
  if (activeWeekLabel) activeWeekLabel.textContent = `Semana: ${activeWeek.title}`;
  if (activeWeekSpan) activeWeekSpan.textContent = `${activeWeek.title} (${activeWeek.year})`;
  
  if (entriesBody) entriesBody.innerHTML = '';
  
  let weekTotal = 0;
  let weekPaid = 0;
  let weekPending = 0;
  
  if (activeWeek.entries.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    
    activeWeek.entries.forEach(entry => {
      const isPaid = entry.pago !== 'Pendiente';
      const totalAmount = parseFloat(entry.total) || 0;
      
      weekTotal += totalAmount;
      if (isPaid) {
        weekPaid += totalAmount;
      } else {
        weekPending += totalAmount;
      }
      
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', entry.id);
      
      // Auto formatted badge. If clicked, toggles immediately.
      let badgeHtml = '';
      if (isPaid) {
        // Formatted paid label (e.g. "✓ Lunes 10 Ago")
        badgeHtml = `<span class="table-status-badge badge-paid" data-id="${entry.id}" title="Click para marcar como PENDIENTE">✓ ${entry.pago}</span>`;
      } else {
        badgeHtml = `<span class="table-status-badge badge-pending" data-id="${entry.id}" title="Click para marcar como PAGADO hoy">⚠️ Pendiente</span>`;
      }
      
      tr.innerHTML = `
        <td style="font-weight: 500;">${entry.cafeteria}</td>
        <td>${entry.factura ? `<span style="font-family: monospace; font-size: 11px; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color);">${entry.factura}</span>` : '<span style="color: var(--text-secondary); font-style: italic; font-size: 12px;">--</span>'}</td>
        <td style="font-weight: 600;">${formatCurrency(totalAmount)}</td>
        <td>${badgeHtml}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button class="row-del-btn btn-edit-row" data-id="${entry.id}" title="Editar">
              <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
            </button>
            <button class="row-del-btn btn-delete-row" data-id="${entry.id}" title="Eliminar">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
        </td>
      `;
      
      if (entriesBody) entriesBody.appendChild(tr);
    });
  }
  
  updateStatsCards(weekTotal, weekPaid, weekPending);
  
  // Direct Click Toggle Event
  document.querySelectorAll('.table-status-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      const entryId = badge.getAttribute('data-id');
      togglePaymentState(entryId);
    });
  });
  
  // Attach edit and delete events
  document.querySelectorAll('.btn-edit-row').forEach(btn => {
    btn.addEventListener('click', () => {
      const entryId = btn.getAttribute('data-id');
      openRecordModal(entryId);
    });
  });
  
  document.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', () => {
      const entryId = btn.getAttribute('data-id');
      deleteEntry(entryId);
    });
  });
  
  lucide.createIcons();
}

function updateStatsCards(weekTotal, weekPaid, weekPending) {
  const totalEl = document.getElementById('week-total');
  const paidEl = document.getElementById('week-paid');
  const pendingEl = document.getElementById('week-pending');
  
  if (totalEl) totalEl.textContent = formatCurrency(weekTotal);
  if (paidEl) paidEl.textContent = formatCurrency(weekPaid);
  if (pendingEl) pendingEl.textContent = formatCurrency(weekPending);
}

function selectWeek(weekId) {
  state.activeWeekId = weekId;
  saveStateToLocalStorage();
  renderWeeksList();
  renderActiveWeekSheet();
}

// Click Toggle logic: toggles between 'Pendiente' and today's date (Lunes 10 Ago)
function togglePaymentState(entryId) {
  const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
  if (!activeWeek) return;
  
  const entry = activeWeek.entries.find(e => e.id === entryId);
  if (entry) {
    if (entry.pago === 'Pendiente') {
      entry.pago = getFormattedToday();
    } else {
      entry.pago = 'Pendiente';
    }
    saveStateToLocalStorage();
    renderActiveWeekSheet();
  }
}

function deleteEntry(entryId) {
  const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
  if (!activeWeek) return;
  
  if (confirm("¿Deseas eliminar este registro?")) {
    activeWeek.entries = activeWeek.entries.filter(e => e.id !== entryId);
    rebuildCafeteriasList();
    saveStateToLocalStorage();
    renderActiveWeekSheet();
  }
}

// --- Record Modal Logic (Add / Edit) ---

const recordOverlay = document.getElementById('modal-record-overlay');
const recordForm = document.getElementById('record-form');
const recordTitle = document.getElementById('record-modal-title');
const recordIdInput = document.getElementById('record-entry-id');
const cafeteriaValInput = document.getElementById('modal-cafeteria-val');
const facturaInput = document.getElementById('modal-factura-input');
const totalInput = document.getElementById('modal-total-input');
const pagoValInput = document.getElementById('modal-pago-val');
const cafeteriaPillsContainer = document.getElementById('modal-cafeteria-pills');
const pagoPillsContainer = document.getElementById('modal-pago-pills');

// Add Cafeteria Modal Elements
const addCafeteriaBtn = document.getElementById('btn-add-cafeteria');
const addCafeteriaOverlay = document.getElementById('modal-add-cafeteria-overlay');
const newCafeteriaForm = document.getElementById('new-cafeteria-form');
const newCafeteriaNameInput = document.getElementById('new-cafeteria-name-input');
const closeNewCafeteriaBtn = document.getElementById('btn-close-new-cafeteria-modal');
const cancelNewCafeteriaBtn = document.getElementById('btn-cancel-new-cafeteria');

// Track active input for custom keypad
let activeInputField = totalInput;

function setActiveField(inputEl) {
  activeInputField = inputEl;
  facturaInput.classList.remove('active-field');
  totalInput.classList.remove('active-field');
  inputEl.classList.add('active-field');
  
  // Disable dot on invoice number
  const dotBtn = document.getElementById('keypad-dot');
  if (dotBtn) {
    dotBtn.disabled = (inputEl === facturaInput);
  }
}

// Bind click/focus to inputs to shift custom keypad target
facturaInput.addEventListener('focus', () => setActiveField(facturaInput));
facturaInput.addEventListener('click', () => setActiveField(facturaInput));
totalInput.addEventListener('focus', () => setActiveField(totalInput));
totalInput.addEventListener('click', () => setActiveField(totalInput));

// Custom Keypad Listeners
document.addEventListener('DOMContentLoaded', () => {
  const keypad = document.getElementById('modal-numeric-keypad');
  if (keypad) {
    keypad.querySelectorAll('.keypad-btn').forEach(btn => {
      // Prevent focus loss on active input
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      
      btn.addEventListener('click', () => {
        if (!activeInputField) return;
        const key = btn.getAttribute('data-key');
        
        if (key === 'backspace') {
          activeInputField.value = activeInputField.value.slice(0, -1);
        } else if (key === '.') {
          if (activeInputField === totalInput && !activeInputField.value.includes('.')) {
            activeInputField.value += '.';
          }
        } else {
          // Type digit
          activeInputField.value += key;
        }
        
        activeInputField.dispatchEvent(new Event('input'));
      });
    });
  }
  
  // Add Cafeteria Modal Events
  if (addCafeteriaBtn) {
    addCafeteriaBtn.addEventListener('click', () => {
      newCafeteriaForm.reset();
      addCafeteriaOverlay.classList.add('active');
      newCafeteriaNameInput.focus();
    });
  }
  
  const closeCafeteriaModal = () => {
    addCafeteriaOverlay.classList.remove('active');
  };
  
  if (closeNewCafeteriaBtn) closeNewCafeteriaBtn.addEventListener('click', closeCafeteriaModal);
  if (cancelNewCafeteriaBtn) cancelNewCafeteriaBtn.addEventListener('click', closeCafeteriaModal);
  
  if (newCafeteriaForm) {
    newCafeteriaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = newCafeteriaNameInput.value.trim();
      if (newName) {
        if (!state.cafeterias.includes(newName)) {
          state.cafeterias.push(newName);
          state.cafeterias.sort();
          saveStateToLocalStorage();
          
          // Re-render pills if record modal is open
          if (recordOverlay.classList.contains('active')) {
            renderCafeteriaPills(cafeteriaValInput.value);
          }
        }
        closeCafeteriaModal();
      }
    });
  }
});

function openRecordModal(entryId = null) {
  recordForm.reset();
  recordIdInput.value = entryId || '';
  cafeteriaValInput.value = '';
  pagoValInput.value = 'Pendiente';

  if (entryId) {
    // EDIT MODE
    recordTitle.textContent = "Editar Cuenta";
    const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
    const entry = activeWeek ? activeWeek.entries.find(e => e.id === entryId) : null;
    
    if (entry) {
      cafeteriaValInput.value = entry.cafeteria;
      facturaInput.value = entry.factura || '';
      totalInput.value = entry.total;
      pagoValInput.value = entry.pago;
      
      renderCafeteriaPills(entry.cafeteria);
      renderPaymentDayPills(entry.pago);
    }
  } else {
    // ADD MODE - Defaults to Pendiente
    recordTitle.textContent = "Agregar Cuenta";
    renderCafeteriaPills();
    renderPaymentDayPills('Pendiente');
  }
  
  recordOverlay.classList.add('active');
  
  // Default active field is totalInput
  setActiveField(totalInput);
}

function closeRecordModal() {
  recordOverlay.classList.remove('active');
}

// Render cafeteria pills
function renderCafeteriaPills(selectedValue = '') {
  cafeteriaPillsContainer.innerHTML = '';
  
  if (state.cafeterias.length === 0) {
    cafeteriaPillsContainer.innerHTML = `
      <span style="font-size: 12px; color: var(--text-secondary); grid-column: 1 / -1; text-align: center; padding: 12px 0;">
        No hay cafeterías registradas. Créalas usando el botón superior 🏪
      </span>
    `;
    return;
  }
  
  state.cafeterias.forEach(cafeteria => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pill-btn ${selectedValue === cafeteria ? 'active' : ''}`;
    btn.textContent = cafeteria;
    
    btn.addEventListener('click', () => {
      cafeteriaPillsContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cafeteriaValInput.value = cafeteria;
      totalInput.focus();
    });
    
    cafeteriaPillsContainer.appendChild(btn);
  });
}

// Render payment day pills (Pendiente + Days of Active Week)
function renderPaymentDayPills(selectedValue = 'Pendiente') {
  pagoPillsContainer.innerHTML = '';
  
  // 1. Add "Pendiente" pill
  const pendBtn = document.createElement('button');
  pendBtn.type = 'button';
  pendBtn.className = `pill-btn status-pending ${selectedValue === 'Pendiente' ? 'active' : ''}`;
  pendBtn.textContent = '⚠️ Pendiente';
  pendBtn.setAttribute('data-val', 'Pendiente');
  pendBtn.addEventListener('click', () => {
    selectDayPill(pendBtn);
  });
  pagoPillsContainer.appendChild(pendBtn);
  
  // 2. Add dynamic week day pills
  const weekDays = getDaysOfActiveWeek();
  weekDays.forEach(dayStr => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pill-btn status-paid ${selectedValue === dayStr ? 'active' : ''}`;
    
    const parts = dayStr.split(' '); // [Lunes, 10, Ago]
    const shortDay = parts[0].substr(0, 3);
    btn.textContent = `✓ ${shortDay} ${parts[1]} ${parts[2]}`;
    btn.setAttribute('data-val', dayStr);
    
    btn.addEventListener('click', () => {
      selectDayPill(btn);
    });
    pagoPillsContainer.appendChild(btn);
  });
}

function selectDayPill(targetPill) {
  if (!targetPill) return;
  pagoPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  targetPill.classList.add('active');
  pagoValInput.value = targetPill.getAttribute('data-val');
}

// Force digits only on factura
facturaInput.addEventListener('keypress', (e) => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
});

// --- Action Event Handlers ---

document.getElementById('btn-open-record-modal').addEventListener('click', () => {
  openRecordModal();
});

document.getElementById('btn-close-record-modal').addEventListener('click', closeRecordModal);
document.getElementById('btn-cancel-record').addEventListener('click', closeRecordModal);

// Save form submit
recordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
  if (!activeWeek) {
    alert("Por favor selecciona o crea una semana primero.");
    return;
  }
  
  const id = recordIdInput.value;
  const cafeteria = cafeteriaValInput.value;
  const factura = facturaInput.value.trim();
  const total = parseFloat(totalInput.value);
  const pago = pagoValInput.value;
  
  if (!cafeteria) {
    alert("Por favor selecciona una cafetería.");
    return;
  }
  
  if (isNaN(total)) return;
  
  if (id) {
    const entry = activeWeek.entries.find(e => e.id === id);
    if (entry) {
      entry.cafeteria = cafeteria;
      entry.factura = factura;
      entry.total = total;
      entry.pago = pago;
    }
  } else {
    const newEntry = {
      id: generateUUID(),
      cafeteria,
      factura,
      total,
      pago // Defaults to Pendiente or whatever pill is selected
    };
    activeWeek.entries.push(newEntry);
  }
  
  rebuildCafeteriasList();
  saveStateToLocalStorage();
  renderActiveWeekSheet();
  
  closeRecordModal();
});

// Week selector change
document.getElementById('week-dropdown').addEventListener('change', (e) => {
  selectWeek(e.target.value);
});

// Handle Add Week form
document.getElementById('btn-new-week').addEventListener('click', () => {
  const todayStr = formatDateToISO(new Date());
  document.getElementById('week-date-picker').value = todayStr;
  document.getElementById('modal-week-overlay').classList.add('active');
});

document.getElementById('btn-close-week-modal').addEventListener('click', () => {
  document.getElementById('modal-week-overlay').classList.remove('active');
});

document.getElementById('btn-cancel-week').addEventListener('click', () => {
  document.getElementById('modal-week-overlay').classList.remove('active');
});

document.getElementById('btn-save-week').addEventListener('click', () => {
  const dateVal = document.getElementById('week-date-picker').value;
  if (!dateVal) {
    alert("Por favor selecciona una fecha.");
    return;
  }
  
  const parsedDate = parseLocalDate(dateVal);
  const range = getWeekRange(parsedDate);
  
  const exists = state.weeks.some(w => w.id === range.id);
  if (exists) {
    alert(`La semana del ${range.title} ya existe.`);
    selectWeek(range.id);
    document.getElementById('modal-week-overlay').classList.remove('active');
    return;
  }
  
  const newWeek = {
    id: range.id,
    title: range.title,
    year: range.year,
    entries: []
  };
  
  state.weeks.push(newWeek);
  state.activeWeekId = range.id;
  
  saveStateToLocalStorage();
  renderWeeksList();
  renderActiveWeekSheet();
  
  document.getElementById('modal-week-overlay').classList.remove('active');
});

// Delete active week
document.getElementById('btn-delete-week').addEventListener('click', () => {
  if (!state.activeWeekId) return;
  
  const activeWeek = state.weeks.find(w => w.id === state.activeWeekId);
  if (!activeWeek) return;
  
  if (confirm(`¿Eliminar la semana "${activeWeek.title}" y todos sus registros?`)) {
    state.weeks = state.weeks.filter(w => w.id !== state.activeWeekId);
    
    if (state.weeks.length > 0) {
      state.activeWeekId = state.weeks[0].id;
    } else {
      state.activeWeekId = '';
    }
    
    rebuildCafeteriasList();
    saveStateToLocalStorage();
    renderWeeksList();
    renderActiveWeekSheet();
  }
});

// --- Theme Toggler ---
const themeToggle = document.getElementById('theme-toggle');
const themeIconLight = document.getElementById('theme-icon-light');
const themeIconDark = document.getElementById('theme-icon-dark');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'light') {
      if (themeIconLight) themeIconLight.style.display = 'block';
      if (themeIconDark) themeIconDark.style.display = 'none';
    } else {
      if (themeIconLight) themeIconLight.style.display = 'none';
      if (themeIconDark) themeIconDark.style.display = 'block';
    }
    
    localStorage.setItem('cafeterias_theme', newTheme);
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem('cafeterias_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    if (themeIconLight) themeIconLight.style.display = 'block';
    if (themeIconDark) themeIconDark.style.display = 'none';
  } else {
    if (themeIconLight) themeIconLight.style.display = 'none';
    if (themeIconDark) themeIconDark.style.display = 'block';
  }
}

// --- Backup & Restore Modal Controls ---
const backupOverlay = document.getElementById('modal-backup-overlay');
const closeBackupBtn = document.getElementById('btn-close-backup-modal');
const closeBackupFooter = document.getElementById('btn-close-backup');
const backupBtn = document.getElementById('btn-backup');
const exportJsonBtn = document.getElementById('btn-export-json');
const triggerImportBtn = document.getElementById('btn-trigger-import');
const importFileInput = document.getElementById('import-file-input');
const importStatusMsg = document.getElementById('import-status-msg');

if (backupBtn) {
  backupBtn.addEventListener('click', () => {
    if (importStatusMsg) {
      importStatusMsg.textContent = '';
      importStatusMsg.style.color = 'inherit';
    }
    if (backupOverlay) backupOverlay.classList.add('active');
  });
}

const closeBackupModal = () => {
  if (backupOverlay) backupOverlay.classList.remove('active');
};
if (closeBackupBtn) closeBackupBtn.addEventListener('click', closeBackupModal);
if (closeBackupFooter) closeBackupFooter.addEventListener('click', closeBackupModal);

// Export to file
if (exportJsonBtn) {
  exportJsonBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `Respaldo_Cuentas_Cafeterias_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (importStatusMsg) {
      importStatusMsg.textContent = '¡Datos exportados con éxito!';
      importStatusMsg.style.color = 'var(--success)';
    }
  });
}

// Import from file
if (triggerImportBtn) {
  triggerImportBtn.addEventListener('click', () => {
    if (importFileInput) importFileInput.click();
  });
}

if (importFileInput) {
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (importedData && Array.isArray(importedData.weeks)) {
          state = importedData;
          rebuildCafeteriasList();
          
          if (state.weeks.length > 0) {
            if (!state.weeks.some(w => w.id === state.activeWeekId)) {
              state.activeWeekId = state.weeks[0].id;
            }
          } else {
            state.activeWeekId = '';
          }
          
          saveStateToLocalStorage();
          renderWeeksList();
          renderActiveWeekSheet();
          
          if (importStatusMsg) {
            importStatusMsg.textContent = '¡Importación completada con éxito!';
            importStatusMsg.style.color = 'var(--success)';
          }
          
          setTimeout(() => {
            closeBackupModal();
          }, 1500);
        } else {
          throw new Error("Formato inválido");
        }
      } catch (err) {
        if (importStatusMsg) {
          importStatusMsg.textContent = 'Error al importar: archivo inválido.';
          importStatusMsg.style.color = 'var(--danger)';
        }
      }
    };
    reader.readAsText(file);
  });
}

// Print trigger
const printBtn = document.getElementById('btn-print-page');
if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}

// Close modals when clicking overlay
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadStateFromLocalStorage();
  
  renderWeeksList();
  renderActiveWeekSheet();
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registrado con éxito:', reg.scope))
      .catch((err) => console.error('Error al registrar Service Worker:', err));
  }
});
