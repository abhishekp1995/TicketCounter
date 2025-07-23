// Set alert message
function setMessage(element, text, type) {
    element.innerText = text;
    const classMap = {
        success: 'alert alert-success',
        danger: 'alert alert-danger',
        warning: 'alert alert-warning',
        primary: 'alert alert-primary'
    };
    element.setAttribute('class', classMap[type] || '');
}

//Function to format date into DD-MM-YYYY
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // month is 0-based
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    return formattedDate;
}

// Validate if table body has rows
function validateTableRows(tableBody) {
    return tableBody.getElementsByTagName('tr').length > 0;
}

// Calculate grand total
function updateGrandTotal(tableBody, totalCell) {
    grandTotal = 0;
    const rows = tableBody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 5) { // Ensure the row has enough cells
            grandTotal += parseFloat(cells[5].textContent); // Sum up the total column values
        }
    }
    totalCell.textContent = grandTotal.toFixed(2);
    console.log("Total sales updated:", grandTotal); // Debugging statement
}

// Show message and scroll
function showMessageAndScroll(element, text, type) {
    setMessage(element, text, type);
    smoothScrollToTop();
}

// Smooth scroll to top
function smoothScrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}

//Show fileds
function showFieldsById(idArray) {
    idArray.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    });
}

//Hide fields
function hideFieldsById(idArray) {
    idArray.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// Disable multiple fields
function disableFieldsById(idArray) {
    idArray.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });
}

// Enable multiple fields
function enableFieldsById(idArray) {
    idArray.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
}

// Clear all options from a <select>, can be re-used for clearing table rows
function clearOptions(selectElement) {
    selectElement.innerHTML = '';
}

// Reset text fields
function resetTextById(idArray) {
    idArray.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// Reset dropdown fields
function resetDropdownById(idArray) {
    idArray.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 0;
    });
}

// Load and parse Excel sheet
async function loadSheetData(excelFile, sheetName) {
    const response = await fetch(excelFile);
    if (!response.ok) throw new Error(`Failed to load Excel file: ${response.statusText}`);
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

// Debug logger
const DEBUG = true;
function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

// Confirm wrapper
function confirmAction(message) {
    return window.confirm(message);
}
