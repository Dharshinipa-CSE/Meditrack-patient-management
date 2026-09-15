// ---------------------------------------------------------------
// app.js
// Dashboard logic: guards the page, renders the patient table,
// and wires up Create / Read / Update / Delete + search + status filter.
// ---------------------------------------------------------------

// --- Route guard: only logged-in users may view the dashboard ---
if (!localStorage.getItem('authToken')) {
  window.location.href = 'index.html';
}

document.getElementById('loggedInUser').textContent = localStorage.getItem('username') || '';

let allPatients = [];
let editingId = null;
let deletingId = null;
let searchTimer = null;

const tableBody = document.getElementById('patientsTableBody');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const deleteOverlay = document.getElementById('deleteOverlay');
const patientForm = document.getElementById('patientForm');

const GENDER_LABELS = { M: 'Male', F: 'Female', O: 'Other' };
const STATUS_LABELS = { ADMITTED: 'Admitted', TREATMENT: 'Under Treatment', DISCHARGED: 'Discharged' };

// ---------------- Toast ----------------
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ---------------- Render ----------------
function renderPatients(patients) {
  tableBody.innerHTML = '';

  if (!patients.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  patients.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge id-badge">${escapeHtml(p.patient_id)}</span></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.age} / ${GENDER_LABELS[p.gender] || p.gender}</td>
      <td>${escapeHtml(p.diagnosis)}</td>
      <td>${escapeHtml(p.doctor_assigned)}</td>
      <td><span class="badge status-${p.status}">${STATUS_LABELS[p.status] || p.status}</span></td>
      <td>${p.admission_date}</td>
      <td class="actions-cell">
        <button class="btn small" data-edit="${p.id}">Edit</button>
        <button class="btn small danger" data-delete="${p.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
  });
  tableBody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.delete));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------------- Load ----------------
async function loadPatients() {
  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;
  try {
    allPatients = await PatientAPI.list(search, status);
    renderPatients(allPatients);
  } catch (err) {
    showToast('Failed to load patients. Is the backend running?', 'error');
  }
}

document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadPatients, 300);
});

document.getElementById('statusFilter').addEventListener('change', loadPatients);

// ---------------- Add / Edit Modal ----------------
function clearFormErrors() {
  patientForm.querySelectorAll('small.error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function setFormError(field, message) {
  const el = document.getElementById(`${field}Error`);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Patient';
  patientForm.reset();
  clearFormErrors();
  document.getElementById('status').value = 'ADMITTED';
  modalOverlay.classList.add('open');
}

function openEditModal(id) {
  const patient = allPatients.find(p => String(p.id) === String(id));
  if (!patient) return;
  editingId = patient.id;
  document.getElementById('modalTitle').textContent = 'Edit Patient';
  clearFormErrors();
  document.getElementById('name').value = patient.name;
  document.getElementById('patient_id').value = patient.patient_id;
  document.getElementById('age').value = patient.age;
  document.getElementById('gender').value = patient.gender;
  document.getElementById('contact_number').value = patient.contact_number;
  document.getElementById('email').value = patient.email || '';
  document.getElementById('diagnosis').value = patient.diagnosis;
  document.getElementById('doctor_assigned').value = patient.doctor_assigned;
  document.getElementById('status').value = patient.status;
  document.getElementById('admission_date').value = patient.admission_date;
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

document.getElementById('addPatientBtn').addEventListener('click', openAddModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// ---------------- Client-side validation ----------------
function validatePatientForm(payload) {
  let valid = true;
  if (!payload.name) { setFormError('name', 'Name is required.'); valid = false; }
  if (!payload.patient_id) { setFormError('patient_id', 'Patient ID is required.'); valid = false; }
  if (!payload.age || payload.age <= 0 || payload.age > 130) {
    setFormError('age', 'Enter a realistic age (1-130).'); valid = false;
  }
  if (!payload.gender) { setFormError('gender', 'Please select a gender.'); valid = false; }
  if (!/^\d{7,15}$/.test(payload.contact_number)) {
    setFormError('contact_number', 'Contact number must be 7-15 digits.'); valid = false;
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    setFormError('email', 'Enter a valid email address.'); valid = false;
  }
  if (!payload.diagnosis) { setFormError('diagnosis', 'Diagnosis is required.'); valid = false; }
  if (!payload.doctor_assigned) { setFormError('doctor_assigned', 'Assigned doctor is required.'); valid = false; }
  if (!payload.admission_date) { setFormError('admission_date', 'Admission date is required.'); valid = false; }
  return valid;
}

// ---------------- Create / Update submit ----------------
patientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();

  const payload = {
    name: document.getElementById('name').value.trim(),
    patient_id: document.getElementById('patient_id').value.trim(),
    age: Number(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    contact_number: document.getElementById('contact_number').value.trim(),
    email: document.getElementById('email').value.trim(),
    diagnosis: document.getElementById('diagnosis').value.trim(),
    doctor_assigned: document.getElementById('doctor_assigned').value.trim(),
    status: document.getElementById('status').value,
    admission_date: document.getElementById('admission_date').value,
  };

  if (!validatePatientForm(payload)) return;

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (editingId) {
      await PatientAPI.update(editingId, payload);
      showToast('Patient record updated successfully.');
    } else {
      await PatientAPI.create(payload);
      showToast('Patient record created successfully.');
    }
    closeModal();
    loadPatients();
  } catch (err) {
    if (err.data && typeof err.data === 'object') {
      let shown = false;
      Object.entries(err.data).forEach(([field, messages]) => {
        setFormError(field, Array.isArray(messages) ? messages[0] : messages);
        shown = true;
      });
      if (!shown) showToast('Could not save patient record.', 'error');
    } else {
      showToast('Could not save patient record.', 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
});

// ---------------- Delete ----------------
function openDeleteModal(id) {
  const patient = allPatients.find(p => String(p.id) === String(id));
  if (!patient) return;
  deletingId = id;
  document.getElementById('deleteMessage').textContent =
    `This will permanently remove "${patient.name}" (${patient.patient_id}).`;
  deleteOverlay.classList.add('open');
}

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
  deleteOverlay.classList.remove('open');
  deletingId = null;
});

deleteOverlay.addEventListener('click', (e) => {
  if (e.target === deleteOverlay) { deleteOverlay.classList.remove('open'); deletingId = null; }
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deletingId) return;
  try {
    await PatientAPI.remove(deletingId);
    showToast('Patient record deleted.');
    deleteOverlay.classList.remove('open');
    loadPatients();
  } catch (err) {
    showToast('Could not delete patient record.', 'error');
  } finally {
    deletingId = null;
  }
});

// ---------------- Logout ----------------
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await apiRequest('/auth/logout/', { method: 'POST' });
  } catch (_) {
    // even if the request fails, still clear local session
  }
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
});

// ---------------- Init ----------------
loadPatients();
