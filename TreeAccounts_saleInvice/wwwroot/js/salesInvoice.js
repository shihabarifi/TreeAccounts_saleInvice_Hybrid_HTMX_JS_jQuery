document.addEventListener('DOMContentLoaded', function () {
    const detailsTable = document.getElementById('detailsTable').getElementsByTagName('tbody')[0];
    const addRowBtn = document.getElementById('addRow');
    let cachedItems = []; // تخزين الأصناف مؤقتًا

    // استدعاء البيانات مرة واحدة فقط
    async function fetchItems() {
        try {
            const response = await fetch('?handler=Items'); // استدعاء الدالة في الباك-اند
            if (!response.ok) throw new Error('Failed to fetch items');
            cachedItems = await response.json(); // تخزين البيانات
        } catch (error) {
            console.error('Error fetching items:', error);
            cachedItems = [];
        }
    }

    // إضافة صف جديد
    async function addNewRow(existingData = {}) {
        const rowCount = detailsTable.rows.length;
        const row = detailsTable.insertRow();

        row.innerHTML = `
            <td>
                <input type="text" name="Invoice.Details[${rowCount}].ItemCode" class="form-control item-code" value="${existingData.ItemCode || ''}" readonly />
            </td>
            <td>
                <select name="Invoice.Details[${rowCount}].ItemName" class="form-control item-select"></select>
            </td>
            <td>
                <input type="text" name="Invoice.Details[${rowCount}].Unit" class="form-control" value="${existingData.Unit || ''}" required />
            </td>
            <td>
                <input type="number" name="Invoice.Details[${rowCount}].Quantity" class="form-control" value="${existingData.Quantity || ''}" required />
            </td>
            <td>
                <input type="number" name="Invoice.Details[${rowCount}].Cost" class="form-control" value="${existingData.Cost || ''}" required />
            </td>
            <td>
                <input type="number" name="Invoice.Details[${rowCount}].Discount" class="form-control" value="${existingData.Discount || ''}" required />
            </td>
            <td>
                <button type="button" class="btn btn-danger delete-btn">حذف</button>
            </td>
        `;

        // تعبئة القائمة المنسدلة
        const selectElement = row.querySelector('.item-select');
        cachedItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            option.text = item.name;
            option.dataset.code = item.code;
            selectElement.appendChild(option);
        });

        // تحديد الخيار المناسب إذا كانت هناك بيانات موجودة
        if (existingData.ItemName) {
            selectElement.value = existingData.ItemName;
            const selectedOption = Array.from(selectElement.options).find(opt => opt.value === existingData.ItemName);
            if (selectedOption) {
                row.querySelector('.item-code').value = selectedOption.dataset.code;
            }
        }

        // تفعيل Select2
        $(selectElement).select2({
            placeholder: "اختر الصنف",
            allowClear: true
        });

        // تحديث حقل الكود عند تغيير اختيار الصنف
        selectElement.addEventListener('change', function () {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const itemCodeInput = row.querySelector('.item-code');
            itemCodeInput.value = selectedOption ? selectedOption.dataset.code : '';
        });

        // إضافة حدث الحذف
        row.querySelector('.delete-btn').addEventListener('click', function () {
            deleteRow(this);
        });
    }

    // حذف الصف وتحديث المؤشرات
    function deleteRow(button) {
        const row = button.closest('tr');
        if (row) {
            detailsTable.removeChild(row);
            updateRowIndices();
        }
    }

    // تحديث أسماء المؤشرات
    function updateRowIndices() {
        const rows = detailsTable.rows;
        for (let i = 0; i < rows.length; i++) {
            rows[i].querySelectorAll('input, select').forEach(input => {
                if (input.name) {
                    input.name = input.name.replace(/\[\d+\]/, `[${i}]`);
                }
            });
        }
    }

    // تهيئة الصفحة
    async function init() {
        await fetchItems(); // جلب الأصناف

        // قراءة الصفوف الحالية من الخادم (إن وجدت)
        const existingRows = document.querySelectorAll('#detailsTable tbody tr');
        if (existingRows.length > 0) {
            existingRows.forEach((row, index) => {
                const existingData = {
                    ItemCode: row.querySelector('input[name$="ItemCode"]').value,
                    ItemName: row.querySelector('select[name$="ItemName"]').value,
                    Unit: row.querySelector('input[name$="Unit"]').value,
                    Quantity: row.querySelector('input[name$="Quantity"]').value,
                    Cost: row.querySelector('input[name$="Cost"]').value,
                    Discount: row.querySelector('input[name$="Discount"]').value
                };
                addNewRow(existingData); // إضافة الصف مع البيانات الحالية
                row.remove(); // إزالة الصف القديم
            });
        } else {
            addNewRow(); // إضافة صف افتراضي
        }
    }

    addRowBtn.addEventListener('click', () => addNewRow());
    init(); // تشغيل التهيئة
});
