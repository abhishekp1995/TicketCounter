// Initialize form and hide all sections on DOM load
window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing form...");
    const submitButton = document.getElementById('submitButton');
    const fileInput = document.getElementById("formFile");
    const alertMessage = document.getElementById('alertMessage');
    const exportExcel = document.getElementById('exportExcel');
    const ticketcounttable = document.getElementById('ticketcounttable');
    const totalcount = document.getElementById('totalcount');

    fileInput.addEventListener("change", () => {
        console.log("File input changed - resetting UI state");
        setMessage(alertMessage, '', '');
        exportExcel.disabled = true;
        ticketcounttable.innerHTML = "";
        updateTotal();
    });

    // Event listener for submit button click - start validation and counting process
    submitButton.addEventListener("click", async () => {
        console.log("Submit button clicked - starting validation");
        const result = await validateInput(fileInput, alertMessage);
        if (result[0]) {
            console.log("Validation successful, proceeding to count tickets");
            countTickets(result[1], result[2]);
        } else {
            console.log("Validation failed, aborting count");
        }
    });

    // Event listener for excel export button
    exportExcel.addEventListener('click', () => {
        console.log("Export Excel button clicked - preparing data for export");
        const rows = ticketcounttable.getElementsByTagName('tr');
        const data = [];
        let grandTotal = 0;
        // Add header row
        data.push(["S.No", "Processor", "Count"]);
        // Add table data rows
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            const totalValue = parseInt(cells[2].textContent) || 0;
            grandTotal += totalValue;
            data.push([
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
            ]);
        }
        // Add total row
        data.push(["", "Total Tickets", grandTotal.toFixed(0)]);
        console.log("Data prepared for Excel export:", data);
        const ws = XLSX.utils.aoa_to_sheet(data);
        // Center align all cells and set wider column widths
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;
                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
            }
        }
        ws['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "count");
        XLSX.writeFile(wb, "TicketCount.xlsx", { bookType: 'xlsx', cellStyles: true });
        console.log("Excel file 'TicketCount.xlsx' written successfully");
    });
});

// Set alert message with appropriate Bootstrap classes and text
function setMessage(element, text, type) {
    console.log(`Setting alert message: "${text}" with type: ${type}`);
    element.innerText = text;
    const classMap = {
        success: 'alert alert-success',
        danger: 'alert alert-danger',
        warning: 'alert alert-warning',
        primary: 'alert alert-primary'
    };
    element.setAttribute('class', classMap[type] || '');
}

// Validate input file and Excel content
async function validateInput(fileInput, alertMessage) {
    console.log("Starting input validation...");
    let isvalid = true; // Flag to track validity
    let message = '';   // Message to display on validation failure
    let exceldata = null;
    let index = null;

    if (!fileInput.files.length) {
        isvalid = false;
        message = "Please select a file before uploading!";
        console.log("Validation error: No file selected");
    }
    else {
        const file = fileInput.files[0];
        console.log("File selected:", file.name);
        if (!validateFileType(file)) {
            isvalid = false;
            message = "Only Excel files (.xls, .xlsx, .csv) are allowed!";
            console.log("Validation error: Invalid file type");
        }
        else {
            console.log("File type valid, validating Excel content...");
            const result = await ValidateExcelInput(file);
            if (result[0] == false) {
                isvalid = false;
                message = result[1];
                console.log("Validation error: Excel content invalid -", message);
            }
            else {
                console.log("Excel content validated successfully");
                exceldata = result[2];
                index = result[0];
            }
        }
    }
    if (isvalid) {
        setMessage(alertMessage, '', '');
    } else {
        setMessage(alertMessage, message, 'danger');
    }

    return [isvalid, exceldata, index];
}

// Validate file type based on extension
function validateFileType(file) {
    console.log("Validating file type for:", file.name);
    const allowedExtensions = ['.xls', '.xlsx', '.csv'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));
    console.log(`File type is ${isAllowed ? "valid" : "invalid"}`);
    return isAllowed;
}

// Validate Excel file for required "Processor" column
async function ValidateExcelInput(file) {
    console.log("Validating Excel headers for required columns...");
    let found = false;  // Flag to track if "Processor" column found
    let data;
    let message = '';
    try {
        data = await readExcel(file);
        console.log("Parsing excel complete. Total rows in excel:", data.length);
        // Check headers in first row for "Processor"
        for (let index = 0; index < data[0].length; index++) {
            if (data[0][index] == "Processor") {
                found = index;
                console.log(`"Processor" column found at index ${index}`);
                break;
            }
        }
        if (found == false) {
            message = "Processor column not found in excel. Counting can't proceed without processor column. Kindly check the excel file.";
            console.log("Validation error:", message);
        }
    } catch (err) {
        message = "Error reading Excel file: " + err;
        console.error("Error reading Excel file:", err);
    }
    return [found, message, data];
}

// Read Excel file and parse first sheet
function readExcel(file) {
    console.log("Reading Excel file:", file.name);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                console.log("Reading sheet:", sheetName);
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log("Excel data parsed, rows count:", jsonData.length);
                resolve(jsonData);
            } catch (err) {
                console.error("Error parsing Excel file:", err);
                reject(err);
            }
        };
        reader.onerror = function (err) {
            console.error("FileReader error:", err);
            reject(err);
        };
        reader.readAsArrayBuffer(file);
    });
}

// Count tickets for each processor from Excel data
function countTickets(data, index) {
    console.log('Validation passed. Counting processors with unassigned support...');
    const processorCount = {}; // Object to hold counts per processor
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Skip empty rows (all cells are empty or undefined)
        if (!row || row.every(cell => cell === undefined || cell === null || cell.toString().trim() === "")) {
            continue;
        }
        let processor = row[index];
        if (!processor || processor.trim() === "") {
            processor = "Unassigned";
        }
        if (processorCount[processor]) {
            processorCount[processor]++;
        } else {
            processorCount[processor] = 1;
        }
    }
    console.log("Processor count:", processorCount);
    addRows(processorCount);
    updateTotal();
}

// Function to add rows in table based on processor count data
function addRows(data) {
    console.log("Adding rows to ticket count table...");
    // Convert object to array of [processor, count] pairs
    const entries = Object.entries(data);
    // Clear any existing rows if needed
    ticketcounttable.innerHTML = "";
    for (let i = 0; i < entries.length; i++) {
        const [processor, count] = entries[i];
        const newRow = document.createElement('tr');
        newRow.innerHTML =
            `<td>${i + 1}</td>` +
            `<td>${processor}</td>` +
            `<td>${count}</td>`;
        newRow.style.textAlign = 'center';
        ticketcounttable.appendChild(newRow);
        console.log(`Row added: S.No ${i + 1}, Processor: ${processor}, Count: ${count}`);
    }
    console.log('Enabling excel export button...');
    exportExcel.disabled = false;
}

// Function to calculate and update total tickets count
function updateTotal() {
    console.log("Calculating total tickets from table rows...");
    let grandTotal = 0;
    const rows = ticketcounttable.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length >= 3) {
            grandTotal += parseInt(cells[2].textContent);
        }
    }
    totalcount.textContent = grandTotal;
    console.log("Total tickets updated:", grandTotal);
}
