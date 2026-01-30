// State
let contacts = [];
let editingContactId = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const appError = document.getElementById('app-error');
const appSuccess = document.getElementById('app-success');
const contactForm = document.getElementById('contact-form');
const contactsList = document.getElementById('contacts-list');
const userNameSpan = document.getElementById('user-name');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const contactsCount = document.getElementById('contacts-count');
const searchInput = document.getElementById('search-input');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && user) {
    api.setToken(token);
    showApp(JSON.parse(user));
  } else {
    showAuth();
  }
}

// Show/Hide sections
function showAuth() {
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
}

function showApp(user) {
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  userNameSpan.textContent = `Welcome, ${user.name}`;
  loadContacts();
}

function showLoginForm() {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  hideError(authError);
}

function showRegisterForm() {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  hideError(authError);
}

// Error/Success handling
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
  setTimeout(() => hideError(element), 5000);
}

function hideError(element) {
  element.classList.add('hidden');
}

function showSuccess(message) {
  appSuccess.textContent = message;
  appSuccess.classList.remove('hidden');
  setTimeout(() => appSuccess.classList.add('hidden'), 3000);
}

// Auth handlers
async function handleLogin(event) {
  event.preventDefault();
  hideError(authError);

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await api.login(email, password);
    api.setToken(response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    showApp(response.user);

    // Clear form
    event.target.reset();
  } catch (error) {
    showError(authError, error.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  hideError(authError);

  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const response = await api.register(name, email, password);
    api.setToken(response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    showApp(response.user);

    // Clear form
    event.target.reset();
  } catch (error) {
    showError(authError, error.message);
  }
}

function handleLogout() {
  api.clearToken();
  contacts = [];
  showAuth();
  showLoginForm();
}

// Contacts handlers
async function loadContacts() {
  try {
    const response = await api.getContacts();
    contacts = response.contacts;
    renderContacts();
  } catch (error) {
    showError(appError, error.message);
  }
}

function renderContacts(filteredContacts = null) {
  const displayContacts = filteredContacts || contacts;
  contactsCount.textContent = `(${displayContacts.length})`;

  if (displayContacts.length === 0) {
    contactsList.innerHTML = '<p class="empty-message">No contacts found.</p>';
    return;
  }

  contactsList.innerHTML = displayContacts.map(contact => `
    <div class="contact-card" data-id="${contact.id}">
      <div class="contact-card-header">
        <div>
          <div class="contact-name">${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}</div>
          ${contact.company ? `<div class="contact-company">${escapeHtml(contact.company)}</div>` : ''}
        </div>
        <div class="contact-actions">
          <button class="btn btn-secondary btn-small" onclick="editContact('${contact.id}')">Edit</button>
          <button class="btn btn-danger btn-small" onclick="deleteContact('${contact.id}')">Delete</button>
        </div>
      </div>
      <div class="contact-details">
        ${contact.email ? `
          <div class="contact-detail">
            <span class="icon">📧</span>
            <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>
          </div>
        ` : ''}
        ${contact.phone ? `
          <div class="contact-detail">
            <span class="icon">📱</span>
            <a href="tel:${escapeHtml(contact.phone)}">${escapeHtml(contact.phone)}</a>
          </div>
        ` : ''}
      </div>
      ${contact.notes ? `<div class="contact-notes">${escapeHtml(contact.notes)}</div>` : ''}
    </div>
  `).join('');
}

function filterContacts() {
  const searchTerm = searchInput.value.toLowerCase();
  if (!searchTerm) {
    renderContacts();
    return;
  }

  const filtered = contacts.filter(contact =>
    contact.firstName.toLowerCase().includes(searchTerm) ||
    contact.lastName.toLowerCase().includes(searchTerm) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
    (contact.phone && contact.phone.includes(searchTerm)) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm))
  );

  renderContacts(filtered);
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const contactData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    company: document.getElementById('company').value,
    notes: document.getElementById('notes').value
  };

  try {
    if (editingContactId) {
      await api.updateContact(editingContactId, contactData);
      showSuccess('Contact updated successfully!');
    } else {
      await api.createContact(contactData);
      showSuccess('Contact created successfully!');
    }

    cancelEdit();
    loadContacts();
  } catch (error) {
    showError(appError, error.message);
  }
}

function editContact(id) {
  const contact = contacts.find(c => c.id === id);
  if (!contact) return;

  editingContactId = id;
  formTitle.textContent = 'Edit Contact';
  submitBtn.textContent = 'Update Contact';
  cancelBtn.classList.remove('hidden');

  document.getElementById('contact-id').value = contact.id;
  document.getElementById('firstName').value = contact.firstName;
  document.getElementById('lastName').value = contact.lastName;
  document.getElementById('email').value = contact.email || '';
  document.getElementById('phone').value = contact.phone || '';
  document.getElementById('company').value = contact.company || '';
  document.getElementById('notes').value = contact.notes || '';

  // Scroll to form
  document.querySelector('.contact-form-container').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingContactId = null;
  formTitle.textContent = 'Add New Contact';
  submitBtn.textContent = 'Add Contact';
  cancelBtn.classList.add('hidden');
  contactForm.reset();
}

async function deleteContact(id) {
  if (!confirm('Are you sure you want to delete this contact?')) return;

  try {
    await api.deleteContact(id);
    showSuccess('Contact deleted successfully!');
    loadContacts();
  } catch (error) {
    showError(appError, error.message);
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

