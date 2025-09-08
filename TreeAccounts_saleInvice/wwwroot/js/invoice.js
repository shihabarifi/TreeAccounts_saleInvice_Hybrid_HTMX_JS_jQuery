$(document).ready(function () {
    initializeInvoice();

    function initializeInvoice() {
        addNewRowToInvoice();
        attachEventListeners();
    }
    let invoiceId = $('#invoiceId').val(); // رقم الفاتورة موجود في عنصر مخفي

    if (invoiceId > 0) {
        // جلب بيانات الفاتورة من الخادم
        $.ajax({
            url: `/POS?handler=InvoiceJson&invoiceId=${invoiceId}`, // Endpoint الباك-إند
            method: "GET",
            success: function (data) {
                // تمرير البيانات إلى دالة تحميل التفاصيل
                loadInvoiceForEditing(data);
            },
            error: function () {
                alert("حدث خطأ أثناء تحميل بيانات الفاتورة.");
            }
        });
    }

    function attachEventListeners() {
        // اختيار المنتج وتحديث رقم المنتج

        $('#productsTable').on('change', '.productSelect', function (event, isProgrammatic) {
            if (isProgrammatic) return; // تجاهل إذا كان التغيير برمجيًا

            const selectedValue = $(this).val();
            const currentRow = $(this).closest('tr');
            currentRow.find('.ProductID').val(selectedValue);
            currentRow.find('.itemQuantity').val(1);
            if (selectedValue) {
                const unitSelect = currentRow.find('.unitName');
                fetchUnits(selectedValue, unitSelect);
            }
        });

        // تحديث الإجمالي عند إدخال الكمية أو السعر أو نسبة الخصم
        $('#productsTable').on('input', '.itemQuantity, .unitPrice, .itemDescountRatio', function () {
            updateTotals();
        });

        // تحديث الإجمالي الصافي عند تعديل الخصم العام أو المبلغ المدفوع
        $('#discount, #PaidAmoint').on('input', function () {
            updateNetAmount();
        });

        // إضافة صف جديد
        $('#addRow').on('click', function (e) {
            e.preventDefault();
            addNewRowToInvoice();
        });

        // حذف صف
        $('#productsTable').on('click', '.removeProduct', function () {
            $(this).closest('tr').remove();
            updateTotals();
        });

        // تغيير الوحدة
        $('#productsTable').on('change', '.unitName', function () {
            const currentRow = $(this).closest('tr');
            const selectedOption = $(this).find(':selected');
            const unitPrice = selectedOption.data('price');
            const maxQuantity = selectedOption.data('quantity');

            currentRow.find('.unitPrice').val(unitPrice || '');
            invoiceId = $('#invoiceId').val();
            if (invoiceId == 0)
                currentRow.find('.itemQuantity').data('max-quantity', maxQuantity || 0).val(1).trigger('input');
            //  var Q = currentRow.find('.itemQuantity').val();
            currentRow.find('.itemQuantity').val(currentRow.find('.itemQuantity').val()).trigger('input');

        });

        // التحقق من الكمية
        $('#productsTable').on('input', '.itemQuantity', function () {
            const maxQuantity = $(this).data('max-quantity');
            const enteredQuantity = parseFloat($(this).val()) || 0;

            if (enteredQuantity > maxQuantity) {
                alert('الكمية المدخلة أكبر من المتاحة!');
                $(this).val(maxQuantity);
            }
            updateTotals();
        });

        // إرسال الفاتورة
        $('#addInv').on('click', sendInvoiceToServer);
    }

    function addNewRowToInvoice() {
        const newRow = $(`
            <tr>
                <td><input type="text" class="form-control ProductID" placeholder="رقم الصنف"></td>
                <td><select class="form-select productSelect"></select></td>
                <td><select class="form-select unitName"></select></td>
                <td><input type="number" class="form-control unitPrice" placeholder="السعر"></td>
                <td><input type="number" class="form-control itemQuantity" value="0" placeholder="الكمية"></td>
                <td><input type="number" class="form-control itemDescountRatio" value="0" placeholder="نسبة الخصم"></td>
                <td style="display: none;"><input type="number" class="form-control itemDescountAmount" value="0.00" readonly></td>
                <td><input type="number" class="form-control SubTotal" value="0.00" readonly></td>
                   
                <td><button type="button" class="btn btn-label-danger removeProduct"><i class="bx bx-trash"></i></button></td>
            </tr>
        `);
        $('#productsTable tbody').append(newRow);
        initializeProductSelect(newRow.find('.productSelect'));
        // تهيئة الحقول الجديدة باستخدام Select2
        newRow.find('.productSelect').select2({
            placeholder: "اختر عنصرًا",
            allowClear: true
        });
    }

    function initializeProductSelect(selector) {
        fetchProducts(selector);
    }

    function fetchProducts(selector) {
        $.ajax({
            url: "/POS?handler=GetProducts",
            method: "GET",
            success: function (products) {
                const productSelect = $(selector);
                productSelect.empty().append('<option value="">اختر المنتج</option>');
                products.forEach(product => {
                    productSelect.append(`<option value="${product.id}">${product.className}</option>`);
                });
            },
            error: function () {
                alert("حدث خطأ أثناء جلب المنتجات.");
            }
        });
    }

    function fetchUnits(productID, selector) {
        $.ajax({
            url: "/POS?handler=GetUnits",
            method: "GET",
            data: { productID },
            success: function (units) {
                const unitSelect = $(selector);
                unitSelect.empty();
                units.forEach(unit => {
                    unitSelect.append(`
                        <option value="${unit.id}" data-price="${unit.partingPrice}" data-quantity="${unit.availableQuantity}">
                            ${unit.unitName}
                        </option>
                    `);
                });
                unitSelect.change();
            },
            error: function () {
                alert("حدث خطأ أثناء جلب الوحدات.");
            }
        });
    }

    function updateTotals() {
        let totalAmount = 0;
        $('#productsTable tbody tr').each(function () {
            const quantity = parseFloat($(this).find('.itemQuantity').val()) || 0;
            const unitPrice = parseFloat($(this).find('.unitPrice').val()) || 0;
            const discountRatio = parseFloat($(this).find('.itemDescountRatio').val()) || 0;

            const rowTotal = quantity * unitPrice;
            const discountAmount = (rowTotal * discountRatio) / 100;
            const netRowTotal = rowTotal - discountAmount;

            $(this).find('.itemDescountAmount').val(discountAmount.toFixed(2));
            $(this).find('.SubTotal').val(netRowTotal.toFixed(2));

            totalAmount += netRowTotal;
        });
        $('#totalAmount').val(totalAmount.toFixed(2));
        updateNetAmount();
    }

    function updateNetAmount() {
        const totalAmount = parseFloat($('#totalAmount').val()) || 0;
        const discount = parseFloat($('#discount').val()) || 0;
        const paidAmount = parseFloat($('#PaidAmoint').val()) || 0;

        const discountAmount = (totalAmount * discount) / 100;
        const netAmount = totalAmount - discountAmount;

        $('#DiscountAmount').val(discountAmount.toFixed(2));
        $('#netAmount').val(netAmount.toFixed(2));
    }

    function sendInvoiceToServer() {
        const invoiceData = {
            ID: $('#invoiceId').val(),
            PeriodNumber: $('#PeriodNumber').val(),
            SalePointID: parseInt($('#SalePointID').val()),
            TheNumber: $('#TheNumber').val(),
            TheDate: $('#TheDate').val(),
            ThePay: $('#ThePay').val(),
            StoreID: parseInt($('#StoreID').val()),
            AccountID: 1,
            CustomerName: $('#CustomerName').val(),
            Notes: $('#Notes').val(),
            UserID: 1,
            Descount: parseFloat($('#DiscountAmount').val()) || 0,
            Debited: 1,
            PayAmount: parseFloat($('#PaidAmoint').val()) || 0,
            InvoiceDetails: collectInvoiceDetails() // جمع تفاصيل الفاتورة
        };

        const antiForgeryToken = $("input[name='__RequestVerificationToken']").val();

        $.ajax({
            url: "/POS?handler=Save",
            method: "POST",
            contentType: "application/json",
            headers: {
                "RequestVerificationToken": antiForgeryToken
            },
            data: JSON.stringify(invoiceData),
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        title: 'نجاح',
                        text: response.message,
                        icon: 'success'
                    });
                } else {
                    Swal.fire({
                        title: 'خطأ',
                        text: response.message,
                        icon: 'error'
                    });
                }
            },
            error: function (xhr) {
                Swal.fire({
                    title: 'خطأ',
                    text: xhr.responseText,
                    icon: 'error'
                });
            }
        });
    }

    function collectInvoiceDetails() {
        const details = [];
        $('#productsTable tbody tr').each(function () {
            details.push({
                ClassID: $(this).find('.ProductID').val(),
                UnitID: $(this).find('.unitName').val(),
                Quantity: parseFloat($(this).find('.itemQuantity').val()) || 0,
                UnitPrice: parseFloat($(this).find('.unitPrice').val()) || 0,
                SubDescount: parseFloat($(this).find('.itemDescountAmount').val()) || 0,
                TotalAmount: parseFloat($(this).find('.SubTotal').val()) || 0
            });
        });
        return details;
    }

    function loadInvoiceForEditing(invoiceData) {
        $('#productsTable tbody').empty();

        invoiceData.forEach(detail => {
            const classID = parseInt(detail.classID);
            const unitID = parseInt(detail.unitID);

            let newRow = $(`
            <tr>
                <td><input type="text" class="form-control ProductID" value="${detail.classID}" placeholder="رقم الصنف"></td>
                <td>
                    <select class="form-select productSelect">
                        <option value="">اسم الصنف</option>
                    </select>
                </td>
                <td>
                    <select class="form-select unitName">
                        <option value="">اسم الوحدة</option>
                    </select>
                </td>
                <td><input type="number" class="form-control unitPrice" value="${detail.unitPrice}" placeholder="السعر"></td>
                <td><input type="number" class="form-control itemQuantity" value="${detail.quantity}" placeholder="الكمية"></td>
                <td><input type="number" class="form-control itemDescountRatio" value="${detail.subDescount}" placeholder="نسبة الخصم"></td>
                <td style="display: none;"><input type="number" class="form-control itemDescountAmount" value="${detail.subDescount}" required readonly></td>
                <td><input type="number" class="form-control SubTotal" value="${detail.totalAMount}" required readonly></td>
                <td><button type="button" class="btn btn-label-danger removeProduct"><i class="bx bx-trash"></i></button></td>
            </tr>
        `);

            $('#productsTable tbody').append(newRow);

            // تهيئة Select2
            newRow.find('.productSelect').select2({
                placeholder: "اختر عنصرًا",
                allowClear: true
            });

            // تحميل المنتجات مع تحديد المنتج الحالي
            fetchProductsX(newRow.find('.productSelect'), classID);

            // إعداد مستمع الحدث للمنتج
            const currentRow = newRow;
            newRow.find('.productSelect').on('change', function () {
                const productId = $(this).val();
                currentRow.find('.ProductID').val(productId);
                const unitSelect = currentRow.find('.unitName');
                if (productId) {
                    fetchUnitsX(productId, unitSelect, unitID);
                }
            });
        });
    }

    // تعديل fetchProducts لدعم تحديد المنتج المحدد
    //let preventChangeEvent = false;

    function fetchProductsX(selector, selectedProductID = null) {
        $.ajax({
            url: "/POS?handler=GetProducts",
            method: "GET",
            success: function (products) {
                const productSelect = $(selector);
                productSelect.empty().append('<option value="">اسم المنتج</option>');
                products.forEach(product => {
                    let isSelected = product.id === selectedProductID ? "selected" : "";
                    productSelect.append(
                        `<option value="${product.id}" ${isSelected}>${product.className}</option>`
                    );
                });

                if (selectedProductID) {
                    productSelect.val(selectedProductID).trigger('change', [true]); // تمرير "true" لتجنب الحدث

                }
            },
            error: function () {
                alert("حدث خطأ أثناء جلب المنتجات.");
            }
        });
    }


    // تعديل fetchUnits لدعم الوحدة المحددة
    function fetchUnitsX(productID, selector, selectedUnitID = null) {
        $.ajax({
            url: "/POS?handler=GetUnits",
            method: "GET",
            data: { productID: productID },
            success: function (data) {
                const unitSelect = $(selector);
                unitSelect.empty();
                data.forEach(unit => {
                    let isSelected = unit.id === selectedUnitID ? "selected" : "";
                    unitSelect.append(`
                    <option value="${unit.id}" data-price="${unit.partingPrice}" data-quantity="${unit.availableQuantity}" ${isSelected}>
                        ${unit.unitName}
                    </option>
                `);
                });

                if (selectedUnitID) {

                    unitSelect.val(selectedUnitID).change();

                }
            },
            error: function () {
                alert("حدث خطأ أثناء جلب الوحدات.");
            }
        });
    }


});
