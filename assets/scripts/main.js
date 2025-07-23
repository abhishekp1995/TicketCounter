// Initialize form and hide all sections on DOM load
window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing form...");
    const submitButton = document.getElementById('submitButton');
    const fileInput = document.getElementById("formFile");
    const alertMessage = document.getElementById('alertMessage');
    const exportExcel = document.getElementById('exportExcel');
    const ticketcounttable = document.getElementById('ticketcounttable');
    const totalcount = document.getElementById('totalcount');
    let exceldata = null;

    submitButton.addEventListener("click", async () => {
        let result = await validateInput(fileInput, alertMessage, exceldata);
        if (result[0])
            countTickets(result[1]);
    });

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

//Validate input
async function validateInput(fileInput, alertMessage, exceldata) {
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
            result = await ValidateExcelInput(file)
            if (!result[0]) {
                isvalid = false;
                message = result[1];
            }
            else
                exceldata = result[2];
        }
    }
    if (isvalid)
        setMessage(alertMessage, '', '');
    else
        setMessage(alertMessage, message, 'danger');

    return [isvalid, exceldata];
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
    console.log("Validating excel headers...");
    found = false;
    let data;
    message = '';
    try {
        data = await readExcel(file);
        console.log("Parsing excel complete. Total rows in excel:", data.length);
        for (let index = 0; index < data[0].length; index++) {
            if (data[0][index] == "Processor") {
                found = true;
                break;
            }
        }
        if (!found)
            message = "Processor column not found in excel. Counting can't proceed without processor column. Kindly check the excel file."
    } catch (err) {
        message = "Error reading Excel file: " + err;
        console.error("Error reading Excel file:", err);
    }
    return [found, message, data];
}

function readExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                resolve(jsonData);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

//Count tickets for each processor
function countTickets(data) {
    console.log('Validation passed. Counting processors with unassigned support...');
    const processorCount = {};
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let processor = row[5]; // 6th element
        // If processor is empty or just spaces, treat it as "Unassigned"
        if (!processor || processor.trim() === "")
            processor = "Unassigned";
        // Count it
        if (processorCount[processor])
            processorCount[processor]++;
        else
            processorCount[processor] = 1;
    }
    console.log("Processor count (with Unassigned):", processorCount);
    addRows(processorCount);
    updateTotal()
}

//Function to add rows in table
function addRows(data) {
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
        console.log('Enabling excel export button...')
        exportExcel.disabled=false;
    }
}


//Function to calculate total tickets
function updateTotal() {
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


