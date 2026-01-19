/**
 * BioBuilder - Frontend JavaScript
 */

// API base URL
const API_BASE = '';

// State
let documents = [];
let selectedModel = '';
let currentMode = 'qa';
let currentExtractionData = null; // Store for export/filtering

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

    if (!question) return;

    if (documents.length === 0) {
        alert('Please upload at least one document first');
        return;
    }

    // Add user message
    addMessage(question, 'user');
    questionInput.value = '';
    questionInput.style.height = 'auto'; // Reset height

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE}/api/qa/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                model: selectedModel || null
            })
        });

        removeMessage(typingId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get answer');
        }

        const data = await response.json();
        addMessage(data.answer, 'bot');
    } catch (error) {
        removeMessage(typingId);
        addMessage(`Error: ${error.message}`, 'bot');
    }
}

// Add chat message
function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    // Format content with converting newlines to <br> and bold text
    const formattedText = formatText(text);

    messageDiv.innerHTML = `
        <div class="message-content">
            ${formattedText}
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv.id = 'msg-' + Date.now();
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot-message typing-indicator';
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="typing-dots">Thinking...</span>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    const id = 'typing-' + Date.now();
    messageDiv.id = id;
    return id;
}

// Remove message (for typing indicator)
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Trigger extraction from chat
window.triggerExtraction = function () {
    console.log('Triggering extraction...');
    if (documents.length === 0) {
        alert('Please upload documents first.');
        return;
    }

    switchMode('extraction');
    // Small delay to allow UI to switch
    setTimeout(() => {
        extractGenes();
    }, 100);
}

// Extract genes
// Extract genes
async function extractGenes() {
    console.log('Starting extraction...');
    if (documents.length === 0) {
        alert('Please upload at least one document first');
        return;
    }

    const extractBtn = document.getElementById('extractBtn');
    const originalBtnText = extractBtn.innerHTML;

    // Get pre-extraction filters
    const targetGenesInput = document.getElementById('targetGenes').value;
    const targetRelationsInput = document.getElementById('targetRelations').value;

    const targetGenes = targetGenesInput ? targetGenesInput.split(',').map(s => s.trim()).filter(Boolean) : null;
    const targetRelations = targetRelationsInput ? targetRelationsInput.split(',').map(s => s.trim()).filter(Boolean) : null;

    // Set button loading state
    extractBtn.disabled = true;
    extractBtn.innerHTML = `
        <span class="loading-spinner-small"></span>
        Extracting...
    `;

    // Clear previous results and hide toolbar
    extractionResults.innerHTML = '<div class="processing-message">Analyzing documents for biological entities and relationships...</div>';
    document.getElementById('resultsToolbar').classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/api/extraction/genes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel || null,
                target_genes: targetGenes,
                target_relations: targetRelations
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Extraction failed');
        }

        const data = await response.json();
        currentExtractionData = data; // Store for export
        renderExtractionResults(data);

        // Show toolbar if results exist
        if (data.entities.length > 0 || data.relations.length > 0) {
            document.getElementById('resultsToolbar').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Extraction error:', error);
        extractionResults.innerHTML = `<p style="color: var(--error);">Error: ${error.message}</p>`;
    } finally {
        // Restore button state
        extractBtn.disabled = false;
        extractBtn.innerHTML = originalBtnText;
    }
}

// Filter results (Client-side)
function filterResults() {
    const query = document.getElementById('filterInput').value.toLowerCase();

    // Filter entities
    document.querySelectorAll('.entity-card').forEach(card => {
        const name = card.querySelector('.entity-name').textContent.toLowerCase();
        const type = card.querySelector('.entity-type').textContent.toLowerCase();

        if (name.includes(query) || type.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Filter relations
    document.querySelectorAll('.relation-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Export results
function exportResults(format) {
    if (!currentExtractionData) return;

    const data = currentExtractionData;
    let content = '';
    let filename = `bio_extraction_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename += '.json';
        mimeType = 'application/json';
    } else if (format === 'csv') {
        // Create CSV content
        // Entities table
        content += 'ENTITIES\n';
        content += 'Name,Type,Description\n';
        data.entities.forEach(e => {
            content += `"${e.name}","${e.type}","${e.description ? e.description.replace(/"/g, '""') : ''}"\n`;
        });

        content += '\nRELATIONSHIPS\n';
        content += 'Source,Target,Type,Description,Evidence\n';
        data.relations.forEach(r => {
            content += `"${r.source}","${r.target}","${r.type}","${r.description ? r.description.replace(/"/g, '""') : ''}","${r.evidence ? r.evidence.replace(/"/g, '""') : ''}"\n`;
        });

        filename += '.csv';
        mimeType = 'text/csv';
    }

    // Trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
