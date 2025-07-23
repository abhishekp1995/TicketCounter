const validationMessage = document.getElementById('validationMessage'); //message div
const categoryDiv = document.getElementById('categoryinput'); //category input div
const subcategoryDiv = document.getElementById('subcategoryinput'); //subcategory input div
const productDiv = document.getElementById('productinput'); //product entry div
const actionButtons = document.getElementById('actionButtons'); //div containing save and clear buttons
const categoryName = document.getElementById('categoryName');  //category input textbox when category entry
const selectCategory = document.getElementById('selectCategory'); // category selection dropdown when subcategory entry
const subCategoryName = document.getElementById('subCategoryName'); //sub category input text box when subcategory entry
const productCategory = document.getElementById('productCategory'); //product category dropdown when product entry
const productSubCategory = document.getElementById('productSubCategory'); //product sub category dropdown when product entry
const productDescription = document.getElementById('productDescription'); //product description text box when product entry
const hsnCode = document.getElementById('hsnCode'); //HSN code textbox when product entry
const savebutton = document.getElementById('savebutton'); //save button
const clearbutton = document.getElementById('clearbutton'); //clear button
let inputoption = null; //variable to store input radio button option
let rowIndex = null; //variable to store row id for edit or delete action
let row = null;
const excelFile = "static\\assets\\data.xlsx";
const tableHead = document.getElementById('TableHead');
const tableBody = document.getElementById('TableBody');

// Initialize form and hide all sections on DOM load
window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing form...");
    hideFieldsById(['categoryinput', 'subcategoryinput', 'productinput', 'actionButtons']);
    document.querySelector('input[name="entryType"]:checked')?.click();
});

// Event listener for subcategory dropdown - enables subcategory name input when category is selected
selectCategory.addEventListener('change', () => {
    console.log("Category selected in subcategory entry. Enabling subcategory name input.");
    enableFieldsById(['subCategoryName']);
});

// Event listener for product category dropdown - loads subcategories and resets fields
productCategory.addEventListener('change', () => {
    console.log("Category changed in product entry, resetting fields and loading subcategories...");
    resetDropdownById(['productSubCategory']);
    enableFieldsById(['productSubCategory']);
    disableFieldsById(['productDescription', 'hsnCode']);
    loadSubCategories(productCategory.value, productSubCategory);
});

// Event listener for product subcategory dropdown - enables product description and HSN fields
productSubCategory.addEventListener('change', () => {
    console.log("Sub Category changed in product entry, enabling product description and HSN code fields...");
    enableFieldsById(['productSubCategory', 'productDescription', 'hsnCode']);
});

// Event handler for save button - validates input and attempts to save
savebutton.addEventListener('click', async () => {
    if (validateInput()) {
        const result = await ValidateExcelInput();
        if (result[0]) {
            console.log("Validations passed. Proceed with saving data.");
            try {
                let rowData = result[3];
                if (typeof rowData === "string")
                    rowData = [rowData]; // ensure it's always an array
                const res = await fetch('http://127.0.0.1:8000/saveExcel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sheetName: result[2],
                        data: [rowData, rowIndex]
                    })
                });
                const data = await res.json();
                if (!res.ok) {
                    console.error('Server error:', data.error || 'Unknown error');
                    setMessage(validationMessage, "Save failed: " + (data.error || 'Unknown error'), "danger");
                    return;
                }
                console.log("Save response:", data.message);
                if (result[1])
                    setMessage(validationMessage, `${data.message}. Kindly reload the page to see updated content. Note: ${result[1]}`, "warning");
                else
                    setMessage(validationMessage, `Save succeeded: ${data.message}. Kindly reload the page to see updated content.`, "success");
            } catch (err) {
                console.error('Save failed:', err);
                setMessage(validationMessage, "Save failed: " + err.message, "danger");
            }
            if (rowIndex != null) {
                rowIndex = null;
                clearEditModeChanges();
            }
        }
        smoothScrollToTop();
    }
});

// Event handler for clear button - resets form fields based on entry type
clearbutton.addEventListener('click', () => {
    if (clearbutton.textContent == 'Cancel') {
        console.log("Update cancelled. Reloading page...");
        window.location.reload();
    }
    console.log("Clear button clicked. Resetting form fields...");
    setMessage(validationMessage, '', '');
    if (inputoption == 1) {
        resetTextById(['categoryName'])
        console.log("Cleared category name input.");
    }
    else if (inputoption == 2) {
        resetTextById(['subCategoryName'])
        resetDropdownById(['selectCategory'])
        disableFieldsById(['subCategoryName'])
        console.log("Cleared subcategory inputs and disabled subcategory name.");
    }
    else if (inputoption == 3) {
        resetTextById(['productDescription', 'hsnCode'])
        resetDropdownById(['productCategory', 'productSubCategory'])
        disableFieldsById(['productSubCategory', 'productDescription', 'hsnCode'])
        console.log("Cleared product entry inputs and disabled relevant fields.");
    }
});

//Event listener for editing, deleting table rows
tableBody.addEventListener('click', function (event) {
    // Check if a delete link was clicked
    const deleteLink = event.target.closest('.delete-link');
    // Check if an edit link was clicked
    const editLink = event.target.closest('.edit-link');
    if (deleteLink) {
        handleDelete(deleteLink);
        return; // Stop further processing
    }
    if (editLink) {
        handleEdit(editLink);
        return;
    }
});

// Event listener for radio selection - displays appropriate input fields
document.querySelectorAll('input[name="entryType"]').forEach(radio => {
    radio.addEventListener('change', function () {
        console.log("Entry type changed to:", this.value);
        hideFieldsById(['categoryinput', 'subcategoryinput', 'productinput', 'actionButtons']);
        if (this.value === 'category') {
            showFieldsById(['categoryinput', 'actionButtons']);
            inputoption = 1;
            console.log("Showing category input fields.");
        }
        else if (this.value === 'subcategory') {
            console.log("Loading categories for subcategory entry.");
            loadCategories(selectCategory); // Load categories when adding subcategories
            showFieldsById(['subcategoryinput', 'actionButtons']);
            resetDropdownById(['selectCategory']);
            resetTextById(['subCategoryName']);
            disableFieldsById(['subCategoryName']);
            inputoption = 2;
            console.log("Showing subcategory input fields.");
        }
        else if (this.value === 'product') {
            console.log("Loading categories for product entry.");
            loadCategories(productCategory);
            showFieldsById(['productinput', 'actionButtons']);
            resetDropdownById(['productCategory', 'productSubCategory']);
            resetTextById(['productDescription', 'hsnCode']);
            disableFieldsById(['productSubCategory', 'productDescription', 'hsnCode'])
            inputoption = 3;
            console.log("Showing product input fields.");
        }
        //Clear validation message on input change
        setMessage(validationMessage, '', '');
        //Re-suse dropdown option clearing function to clear table header & rows
        clearOptions(tableHead);
        clearOptions(tableBody);
        //Populate excel data in table
        addColumn();
        addRow();
    }
    );
});

// Validate input fields based on selected entry type
function validateInput() {
    console.log("Validating input...");
    let message = '';
    let isvalid = true;
    if (inputoption === null) {
        message += 'Please select an entry type.\n';
        isvalid = false;
    }
    if (inputoption == 1) {
        if (categoryName.value.trim() === '') {
            message += 'Please enter category name.\n';
            isvalid = false;
        }
    }
    else if (inputoption == 2) {
        if (subCategoryName.value.trim() === '') {
            message += 'Please enter sub category name.\n';
            isvalid = false;
        }
        if (selectCategory.value == 0) {
            message += 'Please select category.\n';
            isvalid = false;
        }
    }
    else if (inputoption == 3) {
        if (productSubCategory.value == 0) {
            message += 'Please select sub category.\n';
            isvalid = false;
        }
        if (productCategory.value == 0) {
            message += 'Please select category.\n';
            isvalid = false;
        }
        if (productDescription.value.trim() === '') {
            message += 'Please enter product.\n';
            isvalid = false;
        }
        if (hsnCode.value.trim() === '') {
            message += 'Please enter HSN code.\n';
            isvalid = false;
        }
    }
    console.log("Validation result:", isvalid, "Message:", message);
    if (!isvalid)
        setMessage(validationMessage, message, 'danger');
    else
        setMessage(validationMessage, '', '');
    return isvalid;
}

// Validate excel data for duplicates and partial duplicates
async function ValidateExcelInput() {
    console.log("Validation excel for duplicates, partial duplicates...");
    let rowToAdd = [];
    let partialMessage = "";
    let duplicatMessage = "";
    let sheetName = "";
    isvalid = true;
    // --- CATEGORY ENTRY ---
    if (inputoption == 1) {
        sheetName = "categories";
        const catVal = categoryName.value.trim();
        const jsonData = await loadSheetData(excelFile, sheetName);
        const result = checkDuplicateCat(catVal, jsonData);
        if (result) {
            duplicatMessage += "Category already exists, unable to save !";;
            isvalid = false;
        }
        rowToAdd = [catVal];
    }
    // --- SUBCATEGORY ENTRY ---
    else if (inputoption == 2) {
        sheetName = "subcategories";
        const catVal = selectCategory.value.trim();
        const subcatVal = subCategoryName.value.trim();
        const jsonData = await loadSheetData(excelFile, sheetName);
        const result = checkDuplicateSubCat(subcatVal, catVal, jsonData);
        if (result[0]) {
            duplicatMessage += "Subcategory already exists for selected category, unable to save !";;
            isvalid = false;
        }
        else if (result[1])
            partialMessage += 'Subcategory exists for 1 or more category(s).';
        rowToAdd = [catVal, subcatVal];
    }
    // --- PRODUCT ENTRY ---
    else if (inputoption == 3) {
        sheetName = "product_descriptions";
        const catVal = productCategory.value.trim();
        const subcatVal = productSubCategory.value.trim();
        const descVal = productDescription.value.trim();
        const hsnVal = hsnCode.value.trim();
        const jsonData = await loadSheetData(excelFile, sheetName);
        const result = checkDuplicateProdHSN(descVal, hsnVal, catVal, subcatVal, jsonData);
        if (result[0]) {
            duplicatMessage += "Product description already exists for selected category, subcategory, HSN, unable to save !";
            isvalid = false;
        }
        else if (result[1])
            partialMessage = "Product exists under 1 or more category, subcategory, HSN combination.";
        rowToAdd = [descVal, hsnVal, catVal, subcatVal];
    }
    else {
        duplicatMessage += "Unknown input option. Kindly retry !";
        console.log(`Unknown input option: ${inputoption}`);
        isvalid = false;
    }
    if (!isvalid)
        setMessage(validationMessage, duplicatMessage, "danger");
    else
        setMessage(validationMessage, '', '');
    console.log(`Data to be added in excel: ${rowToAdd}; sheetname: ${sheetName}; partial duplicate message: ${partialMessage || 'None'}; valid: ${isvalid}`);
    return [isvalid, partialMessage, sheetName, rowToAdd];
}

// Load categories from excel file or memory and populate dropdown
async function loadCategories(category) {
    console.log("Loading categories from data.xlsx...");
    try {
        const jsonData = await loadSheetData(excelFile, "categories");
        clearOptions(category);
        category.innerHTML = '<option value="0" disabled selected>-- Select Category --</option>';
        for (let i = 1; i < jsonData.length; i++) {
            const option = document.createElement('option');
            option.value = jsonData[i][0];
            option.textContent = jsonData[i][0];
            category.appendChild(option);
        }
        console.log("Categories loaded from file and dropdown populated.");
    }
    catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load subcategories for selected category and populate dropdown
async function loadSubCategories(category, subcategory) {
    console.log("Loading sub categories for selected category:", category.value);
    try {
        const jsonData = await loadSheetData(excelFile, "subcategories");
        clearOptions(subcategory);
        subcategory.innerHTML = '<option value="0" disabled selected>-- Select Sub Category --</option>';
        for (let i = 1; i < jsonData.length; i++) {
            if (jsonData[i][0] === category) {
                const option = document.createElement('option');
                option.value = jsonData[i][1];
                option.textContent = jsonData[i][1];
                subcategory.appendChild(option);
            }
        }
        console.log("Subcategories loaded from file and dropdown populated.");
    }
    catch (error) {
        console.error('Error loading subcategories:', error);
    }
}

//Function to add rows to table for added entries in fields
function addColumn() {
    console.log('Adding table headers based in input option=' + inputoption)
    // Create new table row
    const newRow = document.createElement('tr');
    header = `<th style="width: 10%;">SL No.</th>`;
    if (inputoption == 1) {
        header +=
            `<th style="width: 80%;">Category</th>`;
    }
    if (inputoption == 2) {
        header +=
            `<th style="width: 40%;">Subcategory</th>` +
            `<th style="width: 40%;">Category</th>`;
    }
    if (inputoption == 3) {
        header +=
            `<th style="width: 40%;">Product Description</th>` +
            `<th style="width: 10%;">HSN Code</th>` +
            `<th style="width: 15%;">Category</th>` +
            `<th style="width: 15%;">Subcategory</th>`;
    }
    header += `<th style="width: 10%;">Action</th>`;
    newRow.innerHTML = header;
    newRow.style.textAlign = 'center';
    newRow.style.backgroundColor = '#007bff';
    newRow.style.color = 'white';
    tableBody.appendChild(newRow);
}

//Function to add rows to table for added entries in fields
async function addRow() {
    try {
        if (inputoption == 1) {
            const content = await readData("categories", inputoption);
            for (let i = 0; i < content.length; i++) {
                const newRow = document.createElement('tr');
                newRow.setAttribute("data-excel-row-index", i + 2);  //i+2 binds the table row id with row # in excel file
                newRow.innerHTML =
                    `<td>${tableBody.rows.length}</td>` +
                    `<td>${content[i]}</td>` +
                    `<td>
                        <a href="#" class="delete-link" data-action="delete">
                            <img src="static/assets/delete-icon.png" alt="Delete" width="20" height="20">
                        </a>
                        <a href="#" class="edit-link" data-action="edit">
                            <img src="static/assets/edit-icon.png" alt="Edit" width="20" height="20" style="margin-left:6px">
                        </a>
                    </td>`;
                newRow.style.textAlign = 'center';
                tableBody.appendChild(newRow);
            }
        } else if (inputoption == 2) {
            const content = await readData("subcategories", inputoption);
            for (let i = 0; i < content.length; i++) {
                const newRow = document.createElement('tr');
                newRow.setAttribute("data-excel-row-index", i + 2); //i+2 binds the table row id with row # in excel file
                const data = content[i].split('|');
                newRow.innerHTML =
                    `<td>${tableBody.rows.length}</td>` +
                    `<td>${data[1]}</td>` +
                    `<td>${data[0]}</td>` +
                    `<td>
                        <a href="#" class="delete-link" data-action="delete">
                            <img src="static/assets/delete-icon.png" alt="Delete" width="20" height="20">
                        </a>
                        <a href="#" class="edit-link" data-action="edit">
                            <img src="static/assets/edit-icon.png" alt="Edit" width="20" height="20" style="margin-left:6px">
                        </a>
                    </td>`
                newRow.style.textAlign = 'center';
                tableBody.appendChild(newRow);
            }
        } else if (inputoption == 3) {
            const content = await readData("product_descriptions", inputoption);
            for (let i = 0; i < content.length; i++) {
                const newRow = document.createElement('tr');
                newRow.setAttribute("data-excel-row-index", i + 2); //i+2 binds the table row id with row # in excel file
                const data = content[i].split('|');
                newRow.innerHTML =
                    `<td>${tableBody.rows.length}</td>` +
                    `<td>${data[0]}</td>` +
                    `<td>${data[1]}</td>` +
                    `<td>${data[2]}</td>` +
                    `<td>${data[3]}</td>` +
                    `<td>
                        <a href="#" class="delete-link" data-action="delete">
                            <img src="static/assets/delete-icon.png" alt="Delete" width="20" height="20">
                        </a>
                        <a href="#" class="edit-link" data-action="edit">
                            <img src="static/assets/edit-icon.png" alt="Edit" width="20" height="20" style="margin-left:6px">
                        </a>
                    </td>`
                newRow.style.textAlign = 'center';
                tableBody.appendChild(newRow);
            }
        }
    } catch (error) {
        console.error("Error adding row:", error);
        setMessage(validationMessage, "Error loading table rows: " + error.message, "danger");
    }
}

//Function to read data from excel
async function readData(sheetname) {
    let content = [];
    exceldata = '';
    console.log("Loading data from data.xlsx...");
    try {
        const jsonData = await loadSheetData(excelFile, sheetname);
        for (let i = 1; i < jsonData.length; i++) {
            if (inputoption == 1) {
                exceldata = jsonData[i][0];
            }
            else if (inputoption == 2) {
                exceldata = jsonData[i][0] + '|' + jsonData[i][1]
            }
            else if (inputoption == 3) {
                exceldata = jsonData[i][0] + '|' + jsonData[i][1] + '|' + jsonData[i][2] + '|' + jsonData[i][3]
            }
            content.push(exceldata)
        }
        console.log(`Content loaded: ${content}`);
        return content;
    } catch (error) {
        console.error('Error loading excel data:', error);
        return content; // empty
    }
}

//Function to handle edit data from excel
async function handleEdit(link) {
    clearEditModeChanges();
    row = link.closest('tr');
    rowIndex = parseInt(row.dataset.excelRowIndex);
    if (isNaN(rowIndex)) {
        console.error("Invalid row index — edit aborted.");
        return;
    }
    if (!confirm("This will overwrite current form values. Proceed?")) return;
    console.log(`Edit clicked for row: ${rowIndex - 1}; excel row: ${rowIndex}; inputoption=${inputoption}`);
    const cells = row.querySelectorAll('td');
    if (inputoption == 1) {
        const catVal = cells[1].textContent.trim();
        categoryName.value = catVal;
    }
    else if (inputoption == 2) {
        const subcatVal = cells[1].textContent.trim();
        const catVal = cells[2].textContent.trim();
        subCategoryName.value = subcatVal;
        selectCategory.value = catVal;
        // if selectCategory failsto set (blank), inject and re-set
        if (selectCategory.value == '') {
            if (![...selectCategory.options].some(opt => opt.value === catVal)) {
                const newOption = new Option(catVal, catVal);
                selectCategory.add(newOption);
            }
            selectCategory.value = catVal;  // set again after injection
        }
        enableFieldsById(['subCategoryName']);
    }
    else if (inputoption == 3) {
        const descVal = cells[1].textContent.trim();
        const hsnVal = cells[2].textContent.trim();
        const catVal = cells[3].textContent.trim();
        const subcatVal = cells[4].textContent.trim();
        productDescription.value = descVal;
        hsnCode.value = hsnVal;
        productCategory.value = catVal;
        await loadSubCategories(productCategory.value, productSubCategory);
        productSubCategory.value = subcatVal;
        if (productSubCategory.value == '') {
            // Ensure subcategory exists in dropdown before setting it
            if (![...productSubCategory.options].some(opt => opt.value === subcatVal)) {
                const newOption = new Option(subcatVal, subcatVal);
                productSubCategory.add(newOption);
            }
        }
        enableFieldsById(['productSubCategory', 'productDescription', 'hsnCode']);
    }
    //apply changes to table and buttons in edit mode
    applyEditModeChanges(row);
    // Scroll to top
    smoothScrollToTop();
}

//Function to delete data from excel
function handleDelete(link) {
    row = link.closest('tr');
    rowIndex = parseInt(row.dataset.excelRowIndex);
    if (isNaN(rowIndex)) {
        console.error("Invalid row index — deletion aborted.");
        return;
    }
    if (!confirm("Are you sure you want to delete this row?")) return;
    console.log(`Row to be deleted: ${rowIndex - 1}; excel row: ${rowIndex}; inputoption=${inputoption}`);

    if (inputoption == 1)
        deleteData('categories');
    else if (inputoption == 2)
        deleteData('subcategories');
    else if (inputoption == 3)
        deleteData('product_descriptions');
}

//Function to handle delete API call
async function deleteData(sheetname) {
    console.log("Proceed with deleting data...");
    try {
        const res = await fetch('http://127.0.0.1:8000/deleteEntry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sheetName: sheetname,
                data: rowIndex
            })
        });
        const data = await res.json();
        if (!res.ok)
            setMessage(validationMessage, "Deletion failed: " + (data.error || 'Unknown error') + '. Row might be already deleted. Kindly reload the page to see updated content.', "danger");
        else
            setMessage(validationMessage, `Deletion succeeded: ${data.message}. Kindly reload the page to see updated content.`, "success");
        console.log("Delete response:", data.message);
    } catch (err) {
        console.error('Deletion failed:', err);
        setMessage(validationMessage, "Deletion failed: " + err.message, "danger");
    }
    rowIndex = null;
    smoothScrollToTop();
}

//Function to apply changes to table and buttons in edit mode
function applyEditModeChanges(row) {
    //Disable delete icon when edit mode enabled
    document.querySelectorAll('.delete-link').forEach(link => {
        link.style.pointerEvents = 'none';   // block clicks
        link.style.opacity = '0.5';          // visual dim
    });
    // Lock row visually
    row.style.backgroundColor = '#f8d7da'; // light red
    row.style.fontWeight = 'bold';
    //Change save,clear button text to Update, Cancel
    savebutton.textContent = "Update";
    clearbutton.textContent = "Cancel";
    clearbutton.setAttribute('class', 'btn btn-danger');
}

//Function to revert changes to table and buttons in edit mode
function clearEditModeChanges() {
    document.querySelectorAll('.delete-link').forEach(link => {
        if (link.style.pointerEvents != 'auto') {
            link.style.pointerEvents = 'auto';   // enable clicks
            link.style.opacity = '1';          // visual enabled
        }
    });
    const rows = tableBody.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        if ((rows[i].style.backgroundColor != 'white') && (rows[i].style.fontWeight != 'normal')) {
            rows[i].style.backgroundColor = 'white';
            rows[i].style.fontWeight = 'normal';
        }
    }
    if (savebutton.textContent != "Save")
        savebutton.textContent = "Save";
    if (clearbutton.textContent != "Clear") {
        clearbutton.textContent = "Clear";
        clearbutton.setAttribute('class', 'btn btn-secondary');
    }
}

