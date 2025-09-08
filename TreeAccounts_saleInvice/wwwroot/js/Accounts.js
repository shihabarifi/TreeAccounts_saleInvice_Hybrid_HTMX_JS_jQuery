
$(document).ready(function () {

    // =============================================
    // 1. إعداد شجرة jstree (Tree View)
    // =============================================
    var theme = $('html').hasClass('light-style') ? 'default' : 'default-dark';

    $('#jstree-ajax').jstree({
        core: {
            themes: {
                name: theme
            },
            data: {
                url: '/Accounts?handler=TreeData',
                data: function (node) {
                    return { id: node.id };
                },
                dataType: 'json'
            },
            html_titles: true  // 👈 تفعيل عرض HTML داخل text
        },
        plugins: ['types', 'search'], // 🟢 إضافة البحث
        types: {
            default: { icon: 'bx bx-folder' },
            folder: { icon: 'bx bx-folder text-primary' },
            'folder-open': { icon: 'bx bx-folder-open text-primary' },
            file: { icon: 'bx bx-file text-success' },
            root: { icon: 'bx bx-git-branch text-danger' }
        }
    });
    // 🟢 البحث (مع تأخير بسيط)
    var to = false;
    $('#treeSearch').keyup(function () {
        if (to) { clearTimeout(to); }
        to = setTimeout(function () {
            var v = $('#treeSearch').val();
            $('#jstree-ajax').jstree(true).search(v);
        }, 300);
    });
    

    // ⬇️ توسيع أول عقدة (الجذر) بعد تحميل الشجرة
    $('#jstree-ajax').on("loaded.jstree", function () {
        var instance = $(this).jstree(true);
        // الحصول على أول عقدة جذرية (عادةً أول عنصر في جذر الشجرة)
        var rootNode = instance.get_node(instance.get_container().find('li:first'));
        if (rootNode && rootNode.id) {
            instance.open_node(rootNode);
        }
    });


    // =============================================
    // 2. حذف الفاتورة باستخدام SweetAlert و Ajax
    // =============================================
    $('.delete-record').on('click', function () {
        var accountNumber = $(this).data('account-id');
        alert(accountNumber);
        const antiForgeryToken = $("input[name='__RequestVerificationToken']").val();

        if (!accountNumber) {
            Swal.fire('خطأ!', 'لم يتم العثور على رقم الفاتورة.', 'error');
            return;
        }

        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'لن يمكنك استرجاع الحساب بعد الحذف!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذفه',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: "/Accounts?handler=DeleteAccount",
                    method: "GET",
                    data: { accountNumber },
                    success: function (response) {
                        if (response.success) {
                            Swal.fire({
                                title: 'تم الحذف!',
                                text: response.message,
                                icon: 'success'
                            }).then(() => {
                                var row = $(`tr[data-account-id="${accountNumber}"]`);
                                row.css("background-color", "#ffcccc");
                                row.fadeOut(1000, function () {
                                    $(this).remove();
                                });
                            });
                        } else {
                            Swal.fire('خطأ!', response.message, 'error');
                        }
                    },
                    error: function () {
                        Swal.fire('خطأ!', 'حدث خطأ في الاتصال بالخادم.', 'error');
                    }
                });
            }
        });
    });


    // =============================================
    // 3. تهيئة جدول البيانات (DataTable)
    // =============================================
    $('.datatables-basic').DataTable({
        order: [[1, 'ASC']],
        dom:
            '<"row mx-2"' +
            '<"col-md-2"<"me-3"l>>' +
            '<"col-md-10"<"dt-action-buttons text-xl-end text-lg-start text-md-end text-start d-flex align-items-center justify-content-end flex-md-row flex-column mb-3 mb-md-0"fB>>' +
            '>t' +
            '<"row mx-2"' +
            '<"col-sm-12 col-md-6"i>' +
            '<"col-sm-12 col-md-6"p>' +
            '>',
        language: {
            sLengthMenu: '_MENU_',
            search: '',
            searchPlaceholder: 'Search..'
        },
        buttons: [
            {
                extend: 'collection',
                className: 'btn btn-label-secondary dropdown-toggle mx-3',
                text: '<i class="bx bx-upload me-2"></i>Export',
                buttons: [
                    {
                        extend: 'print',
                        text: '<i class="bx bx-printer me-2"></i>Print',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'csv',
                        text: '<i class="bx bx-file me-2"></i>Csv',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'excel',
                        text: 'Excel',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'pdf',
                        text: '<i class="bx bxs-file-pdf me-2"></i>Pdf',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'copy',
                        text: '<i class="bx bx-copy me-2"></i>Copy',
                        className: 'dropdown-item'
                    }
                ]
            }
        ],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "الكل"]]
    });

});
// =============================================
// دالة موحدة لتوليد رقم حساب جديد
// =============================================

/**
 * دالة لتوليد رقم حساب جديد بناءً على رقم الحساب الأب ونوع الحساب
 * @param {string} fatherNumber - رقم حساب الأب
 * @param {string} accountType - نوع الحساب (رئيسي/فرعي)
 * @param {function} [callback] - دالة الاستدعاء العكسي الاختيارية
 */
function generateAccountNumber(fatherNumber, accountType, callback) {
    // التحقق من وجود البيانات المطلوبة
    if (!fatherNumber || !accountType) {
        const errorMsg = 'يجب تحديد كل من رقم حساب الأب ونوع الحساب';
        console.error(errorMsg);
        if (typeof callback === 'function') {
            callback({ success: false, message: errorMsg });
        }
        return;
    }

    // إعداد بيانات الطلب
    const requestData = {
        fatherNumber: fatherNumber,
        accountType: accountType,
        __RequestVerificationToken: $("input[name='__RequestVerificationToken']").val()
    };

    // إرسال طلب AJAX لتوليد رقم الحساب
    $.ajax({
        url: '/Accounts?handler=GenerateAccountNumber',
        method: 'GET',
        data: requestData,
        beforeSend: function () {
            // عرض رسالة تحميل
           // $('#AccountNumber').prop('disabled', true);
        },
        success: function (response) {
            if (response.success && response.accountNumber) {
                $('#AccountNumber').val(response.accountNumber);

                // إذا تم توفير دالة استدعاء عكسي، استدعها
                if (typeof callback === 'function') {
                    callback(response);
                }
            } else {
                const errorMsg = response.message || 'فشل توليد رقم الحساب';
                Swal.fire('تنبيه', errorMsg, 'warning');
                $('#AccountNumber').val('');
            }
        },
        error: function (xhr, status, error) {
            const errorMsg = 'حدث خطأ أثناء توليد رقم الحساب: ' + error;
            console.error(errorMsg);
            Swal.fire('خطأ', errorMsg, 'error');
            $('#AccountNumber').val('');

            // إذا تم توفير دالة استدعاء عكسي، استدعها مع معلومات الخطأ
            if (typeof callback === 'function') {
                callback({
                    success: false,
                    message: errorMsg,
                    status: status,
                    xhr: xhr
                });
            }
        },
        complete: function () {
            $('#AccountNumber').prop('disabled', false);
        }
    });
}

// =============================================
// أحداث لتشغيل الدالة من مصادر مختلفة
// =============================================

// 1. حدث عند تغيير حساب الأب أو نوع الحساب
$('#FatherNumber, #AccountType').on('change', function () {
    const fatherNumber = $('#FatherNumber').val();
    const accountType = $('#AccountType').val();

    generateAccountNumber(fatherNumber, accountType);
});

// 2. حدث عند اختيار عقدة في شجرة الحسابات
$('#jstree-ajax').on("select_node.jstree", function (e, data) {
    // استخراج المعلومات من العقدة المحددة
    const nodeId = data.node.id;
    const nodeText = data.node.text;
   // const nodeType = data.node.type === 'folder' ? 'رئيسي' : 'فرعي';
    const nodeType  = $('#AccountType').val();
    // عرض معلومات العقدة (اختياري)
    console.log("تم اختيار: " + nodeText);
    console.log("رقم الحساب: " + nodeId);
    console.log("نوع الحساب: " + nodeType);
        $('#FatherNumber').val(nodeId).trigger('change');
    if (nodeType != 'فرعي') {
        // تعبئة الحقول تلقائياً
        // $('#AccountType').val(nodeType).trigger('change');

        // توليد رقم الحساب الجديد
        generateAccountNumber(nodeId, nodeType, function (response) {
            if (response.success) {
                // يمكن إضافة أي إجراء إضافي هنا بعد نجاح التوليد
                console.log('تم توليد الرقم بنجاح: ' + response.accountNumber);
            }
        });
    } else {

    Swal.fire('تنبيه', response.message || 'فشل توليد رقم الحساب', 'warning');
    }
  
});






//// =============================================
//// 4. توليد رقم حساب جديد عند اختيار الحساب الأب ونوع الحساب
//// =============================================
//$('#FatherNumber, #AccountType').on('change', function () {
//    var fatherNumber = $('#FatherNumber').val();
//    var accountType = $('#AccountType').val();

//    // لا نولد رقمًا إذا لم يُختر الأب أو النوع
//    if (!fatherNumber || !accountType) {
//        return;
//    }

//    // إرسال طلب AJAX لتوليد رقم الحساب
//    $.ajax({
//        url: '/Accounts?handler=GenerateAccountNumber', // سننشئ هذا Handler
//        method: 'GET',
//        data: {
//            fatherNumber: fatherNumber,
//            accountType: accountType,
//            __RequestVerificationToken: $("input[name='__RequestVerificationToken']").val()
//        },
//        beforeSend: function () {
//            // اختياري: عرض رسالة تحميل
//            $('#AccountNumber').prop('disabled', true).val('جاري التوليد...');
//        },
//        success: function (response) {
//            if (response.success && response.accountNumber) {
//                $('#AccountNumber').val(response.accountNumber);
//            } else {
//                Swal.fire('تنبيه', response.message || 'فشل توليد رقم الحساب', 'warning');
//                $('#AccountNumber').val('');
//            }
//        },
//        error: function () {
//            Swal.fire('خطأ', 'حدث خطأ أثناء توليد رقم الحساب.', 'error');
//            $('#AccountNumber').val('');
//        },
//        complete: function () {
//            $('#AccountNumber').prop('disabled', false);
//        }
//    });
//});
