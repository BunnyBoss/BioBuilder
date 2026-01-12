/**
 * BioBuilder - Frontend JavaScript
 */

// API base URL
const API_BASE = '';

// State
let documents = [];
let selectedModel = '';
let currentMode = 'qa';

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const documentList = document.getElementById('documentList');
const modelSelect = document.getElementById('modelSelect');
const questionInput = document.getElementById('questionInput');
const qaResults = document.getElementById('qaResults');
const extractionResults = document.getElementById('extractionResults');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    loadDocuments();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // File upload
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    // Model select
    modelSelect.addEventListener('change', () => {
        selectedModel = modelSelect.value;
    });

    // Enter key in question input
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    });
}

// Load available models
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/api/models`);
        const data = await response.json();

        modelSelect.innerHTML = '';
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });

        if (data.models.length > 0) {
            selectedModel = data.models[0].id;
        }
    } catch (error) {
        console.error('Failed to load models:', error);
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
    }
}

// Load documents
async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE}/api/documents`);
        const data = await response.json();
        documents = data.documents;
        renderDocumentList();
    } catch (error) {
        console.error('Failed to load documents:', error);
    }
}

// Handle file selection
function handleFileSelect(e) {
    handleFiles(e.target.files);
    fileInput.value = '';
}

// Handle files upload
async function handleFiles(files) {
    for (const file of files) {
        await uploadFile(file);
    }
}

// Upload single file
async function uploadFile(file) {
    showLoading(`Uploading ${file.name}...`);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/documents/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const data = await response.json();
        documents.push(data.document);
        renderDocumentList();
    } catch (error) {
        alert(`Failed to upload ${file.name}: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Render document list
function renderDocumentList() {
    if (documents.length === 0) {
        documentList.innerHTML = '<p class="empty-state">No documents uploaded</p>';
        return;
    }

    documentList.innerHTML = documents.map(doc => `
        <div class="document-item" data-id="${doc.id}">
            <div class="doc-info">
                <span class="doc-name" title="${doc.filename}">${doc.filename}</span>
                <span class="doc-meta">${doc.word_count.toLocaleString()} words</span>
            </div>
            <button class="btn btn-danger" onclick="deleteDocument('${doc.id}')">✕</button>
        </div>
    `).join('');
}

// Delete document
async function deleteDocument(docId) {
    try {
        await fetch(`${API_BASE}/api/documents/${docId}`, { method: 'DELETE' });
        documents = documents.filter(d => d.id !== docId);
        renderDocumentList();
    } catch (error) {
        alert('Failed to delete document');
    }
}

// Switch mode
function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    document.getElementById('qaMode').classList.toggle('hidden', mode !== 'qa');
    document.getElementById('extractionMode').classList.toggle('hidden', mode !== 'extraction');
}

// Ask question
async function askQuestion() {
    const question = questionInput.value.trim();

    if (!question) {
        alert('Please enter a question');
        return;
    }

    if (documents.length === 0) {
        alert('Please upload at least one document first');
        return;
    }

    showLoading('Analyzing documents...');

    try {
        const response = await fetch(`${API_BASE}/api/qa/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                model: selectedModel || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get answer');
        }

        const data = await response.json();
        renderAnswer(data);
    } catch (error) {
        qaResults.innerHTML = `<p style="color: var(--error);">Error: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}

// Render answer
function renderAnswer(data) {
    qaResults.innerHTML = `
        <div class="answer-content">${formatText(data.answer)}</div>
        <div class="answer-meta">
            Model: ${data.model_used} | Documents used: ${data.documents_used}
        </div>
    `;
}

// Extract genes
async function extractGenes() {
    if (documents.length === 0) {
        alert('Please upload at least one document first');
        return;
    }

    showLoading('Extracting genes and proteins... This may take a moment.');

    try {
        const response = await fetch(`${API_BASE}/api/extraction/genes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Extraction failed');
        }

        const data = await response.json();
        renderExtractionResults(data);
    } catch (error) {
        extractionResults.innerHTML = `<p style="color: var(--error);">Error: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}

// Render extraction results
function renderExtractionResults(data) {
    if (data.entities.length === 0 && data.relations.length === 0) {
        extractionResults.innerHTML = '<p class="placeholder-text">No genes or proteins found in the documents.</p>';
        return;
    }

    let html = '';

    // Entities section
    if (data.entities.length > 0) {
        html += `
            <div class="entities-section">
                <h3 class="section-title">🧬 Entities (${data.entities.length})</h3>
                <div class="entity-grid">
                    ${data.entities.map(entity => `
                        <div class="entity-card">
                            <div class="entity-name">${entity.name}</div>
                            <div class="entity-type">${entity.type}</div>
                            ${entity.description ? `<div class="entity-desc">${entity.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Relations section
    if (data.relations.length > 0) {
        html += `
            <div class="relations-section">
                <h3 class="section-title">🔗 Relationships (${data.relations.length})</h3>
                <div class="relation-list">
                    ${data.relations.map(rel => `
                        <div class="relation-card">
                            <div class="relation-header">
                                <span class="relation-entity">${rel.source}</span>
                                <span class="relation-arrow">→</span>
                                <span class="relation-entity">${rel.target}</span>
                                <span class="relation-type-badge">${rel.type}</span>
                            </div>
                            ${rel.description ? `<div class="entity-desc">${rel.description}</div>` : ''}
                            ${rel.evidence ? `<div class="relation-evidence">"${rel.evidence}"</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `
        <div class="answer-meta">
            Model: ${data.model_used} | Documents used: ${data.documents_used}
            ${data.parse_error ? ' | ⚠️ Partial results (parsing error)' : ''}
        </div>
    `;

    extractionResults.innerHTML = html;
}

// Format text with basic markdown-like processing
function formatText(text) {
    return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Show loading overlay
function showLoading(text = 'Processing...') {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}
