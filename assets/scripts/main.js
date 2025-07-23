// Initialize form and hide all sections on DOM load
window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing form...");
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById("formFile");
    const alertMessage = document.getElementById('alertMessage');

    uploadForm.addEventListener("submit", function (e) {
        e.preventDefault();
        validateInput(fileInput, alertMessage);
    });
});

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

//Validat input
function validateInput(fileInput, alertMessage) {
    console.log("Validating file input...");
    isvalid = true;
    message = '';
    if (!fileInput.files.length) {
        isvalid = false;
        message = "Please select a file before uploading!";
    }
    else {
        const file = fileInput.files[0];
        if (!validateFileType(file)) {
            isvalid = false;
            message = "Only Excel files (.xls, .xlsx, .csv) are allowed!";
        }
        else {
            if (!ValidateExcelInput(file)) {
                isvalid = false;
                message = '';
            }
            else
                countTickets();
        }
    }
    if (isvalid)
        setMessage(alertMessage, message, '')
    else
        setMessage(alertMessage, message, 'danger')
}

//Validate file type
function validateFileType(file) {
    console.log("Validating file type...");
    const allowedExtensions = ['.xls', '.xlsx', '.csv'];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
}

// Validate excel for required column
async function ValidateExcelInput(file) {
    console.log("Validating excel...");
    handleExcel(file);
}

function handleExcel(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    // Let's read the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("Excel Data:", jsonData);
    // Store in variable or use as needed
    // Example: store globally
    window.excelData = jsonData;
    console.log("Excel loaded and parsed ! Total Rows: " + jsonData.length);
  };

  reader.readAsArrayBuffer(file);
}


//Function to count tickets for each processor
function countTickets() {

}

//Event listener for excel export button
exportExcel.addEventListener('click', () => {
    const rows = salesTableBody.getElementsByTagName('tr');
    const data = [];
    let grandTotal = 0;

    // Add header row
    data.push(["S.No", "Order ID", "Order Date", "Invoice ID", "Invoice Date", "Total"]);

    // Add table data
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const totalValue = parseFloat(cells[5].textContent) || 0;
        grandTotal += totalValue;

        data.push([
            cells[0].textContent,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent,
            cells[5].textContent,
        ]);
    }

    // Add total row
    data.push(["", "", "", "", "Total Sales (in Rs)", grandTotal.toFixed(2)]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "SalesData.xlsx");
});

//Function to add rows in table
function addRows(data) {
    clearOptions(salesTableBody); //Re-use dropdown option clearing function to clear table rows
    for (let i = 0; i < data.length; i++) {
        const newRow = document.createElement('tr');
        const invoiceButton = data[i][5]
            ? `<a href="/${data[i][5]}" target="_blank" class="btn btn-sm btn-primary">Download</a>`
            : `<span class="text-muted">N/A</span>`;

        newRow.innerHTML =
            `<td>${i + 1}</td>` +
            `<td>${data[i][0]}</td>` +
            `<td>${formatDate(data[i][1])}</td>` +
            `<td>${data[i][2]}</td>` +
            `<td>${formatDate(data[i][3])}</td>` +
            `<td>${data[i][4]}</td>` +
            `<td>${invoiceButton}</td>`;

        newRow.style.textAlign = 'center';
        salesTableBody.appendChild(newRow);
    }
}



