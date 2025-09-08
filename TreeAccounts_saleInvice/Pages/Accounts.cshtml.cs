using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Principal;
using TreeAccounts_saleInvice.Models;
using static TreeAccounts_saleInvice.Pages.AccountsModel;

namespace TreeAccounts_saleInvice.Pages
{
    public class AccountsModel : PageModel
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor httpContextAccessor;
        public AccountsModel(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            this.httpContextAccessor = httpContextAccessor;

        }
        #region Proprieties
        // قائمة الحسابات الحالية
        public List<Account> accounts { get; set; }
        // يمكن تخزين كل الحسابات هنا لتحسين الأداء
        private static List<Account>? allAccountsCache;
        public Account AccountEidter { get; set; } = new Account();

        // نموذج إضافة حساب جديد
        [BindProperty]
        public NewAccountModel NewAccount { get; set; }
        // رسالة نتيجة العملية
        public string Message { get; set; }
        public bool IsSuccess { get; set; }

        public class NewAccountModel
        {
            [Required(ErrorMessage = "رقم الحساب مطلوب")]
            public string AccountNumber { get; set; }

            [Required(ErrorMessage = "اسم الحساب مطلوب")]
            public string AccountName { get; set; }

            public string FatherNumber { get; set; }

            [Required(ErrorMessage = "نوع الحساب مطلوب")]
            public string AccountType { get; set; }

            public string AccountReference { get; set; }
            public string AccountNameEng { get; set; }
          
        }
        public class JsTreeNode
        {
            public string id { get; set; } = "";
            public string text { get; set; } = "";
            public bool children { get; set; }
            public string type { get; set; } = "default"; // 🟢 يحدد الأيقونة من types
        }



        #endregion

        public async Task OnGetAsync()
        {
         await GetAccountListAsync();
            
        }


        // API لإرجاع الأبناء فقط حسب parent

        public async Task<JsonResult> OnGetTreeDataAsync(string id)
        {
            try
            {
                var allAccounts = allAccountsCache;

                List<Account> accounts;

                if (id == "#" || string.IsNullOrEmpty(id))
                {
                    // الجذور
                    accounts = allAccounts
                        .Where(a => string.IsNullOrEmpty(a.FatherNumber) )
                        .ToList();
                }
                else
                {
                    // الأبناء
                    accounts = allAccounts
                        .Where(a => a.FatherNumber == id && a.AccountNumber != "9")
                        .ToList();
                }

                var treeData = BuildJsTree(accounts, allAccounts);

                return new JsonResult(treeData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching accounts: {ex.Message}");
                return new JsonResult(new List<JsTreeNode>());
            }
        }


        public async Task<PartialViewResult> OnPostSaveAccount()
        {
            AlertViewModel alert;
            // 1. منطق التحقق من صحة البيانات (Validation)
            if (!ModelState.IsValid)
            {
                 alert = new AlertViewModel
                {
                    Title = "فشل عملية الاضافة",
                    Message = "الرجاء تعبئة الحقول المطلوبة.",
                    Icon = "erorr",
                    ConfirmButtonText = "موافق",
                    Timer = 3000
                };
                return Partial("_SaveResultPartial", alert);
            }

            try
            {
                // التحقق من عدم تكرار رقم الحساب
                if (allAccountsCache.Any(a => a.AccountNumber == NewAccount.AccountNumber))
                {
                    alert = new AlertViewModel
                    {
                        Title = "فشل عملية الاضافة",
                        Message = "رقم الحساب موجود مسبقاً.",
                        Icon = "erorr",
                        ConfirmButtonText = "موافق",
                        Timer = 3000
                    };
                    return Partial("_SaveResultPartial", alert);
                }

                // 2. إنشاء كائن الحساب الجديد
                var newAccount = new Account
                {
                    AccountNumber = NewAccount.AccountNumber,
                    AccountName = NewAccount.AccountName,
                    FatherNumber = NewAccount.FatherNumber,
                    AccountType = NewAccount.AccountType,
                    AccountNameEng = NewAccount.AccountNameEng,
                    AccountReference = NewAccount.AccountReference,
                   
                };

                // 3. حفظ البيانات في قاعدة البيانات

                var token = httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.PostAsJsonAsync($"/api/Accounts", newAccount);
               
                if (response.IsSuccessStatusCode)
                {
                    // Read the content of the response and deserialize it into an Account object.
                    var createdAccount = await response.Content.ReadFromJsonAsync<Account>();

                    // Now you can access the new ID from the createdAccount object.
                    newAccount.ID = createdAccount.ID;
                    // إضافة الحساب الجديد إلى الكاش مباشرة لتحديث الشجرة
                    allAccountsCache.Add(newAccount);


                    // إرسال Trigger لـ HTMX لإشعار JS بأن الحساب تغير
                    Response.Headers.Add("HX-Trigger", "accountChanged");


                    alert = new AlertViewModel
                    {
                        Title = "نجاح العملية",
                        Message = $"تمت إضافة الحساب : {NewAccount.AccountName}",
                        Icon = "success",
                        ConfirmButtonText = "موافق",
                        Timer = 3000
                    };
                }
                else
                {
                    alert = new AlertViewModel
                    {
                        Title = "فشل عملية الاضافة",
                        Message = $"خطأ في اضافة الحساب : {response.RequestMessage}",
                        Icon = "erorr",
                        ConfirmButtonText = "موافق",
                        Timer = 3000
                    };
            
                }


                // تنظيف النموذج بعد الإضافة الناجحة
               // NewAccount = new NewAccountModel();

                // 6. ارجع الجزء المحدث من الصفحة (النموذج الفارغ أو رسالة النجاح)
                return Partial("_SaveResultPartial", alert);
            }
            catch (Exception ex)
            {
                 alert = new AlertViewModel
                {
                    Title = "فشل عملية الاضافة",
                    Message = $"حدث خطأ أثناء إضافة الحساب: {ex.Message}",
                    Icon = "erorr",
                    ConfirmButtonText = "موافق",
                    Timer = 3000
                };
               
                return Partial("_SaveResultPartial", alert);
            
              
            }
        
    }

        public async Task<PartialViewResult> OnPostUpdateAccount()
        {
            AlertViewModel alert;

            // 1. Validation logic
            if (!ModelState.IsValid)
            {
                alert = new AlertViewModel
                {
                    Title = "فشل عملية التحديث",
                    Message = "الرجاء تعبئة الحقول المطلوبة.",
                    Icon = "error",
                    ConfirmButtonText = "موافق",
                    Timer = 3000
                };
                return Partial("_SaveResultPartial", alert);
            }
            try
            {
                // 2. Create updated account object
                var updatedAccount = new Account
                {
                    AccountNumber = NewAccount.AccountNumber,
                    AccountName = NewAccount.AccountName,
                    FatherNumber = NewAccount.FatherNumber,
                    AccountType = NewAccount.AccountType,
                    AccountNameEng = NewAccount.AccountNameEng,
                    AccountReference = NewAccount.AccountReference,
                
                };


                // Retrieve the account number from the form.
                var accountNumber = NewAccount.AccountNumber;

            // Find the existing account in the database.
            var accountToUpdate = allAccountsCache.FirstOrDefault(a => a.AccountNumber == accountNumber);

            // Check if the account exists.
            if (accountToUpdate == null)
            {
                // Handle the case where the account is not found.
                var notFoundAlert = new AlertViewModel
                {
                    Title = "فشل العملية",
                    Message = "حدث خطأ: الحساب غير موجود.",
                    Icon = "error",
                    ConfirmButtonText = "موافق",
                    Timer = 3000
                };
                return Partial("_SaveResultPartial", notFoundAlert);
            }

                // 3. Save to database
                var token = httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.PutAsJsonAsync($"/api/Accounts", updatedAccount);

                if (response.IsSuccessStatusCode)
                {
                    // Update the cache
                    var existingAccount = allAccountsCache.FirstOrDefault(a => a.AccountNumber == updatedAccount.AccountNumber);
                    if (existingAccount != null)
                    {
                        allAccountsCache.Remove(existingAccount);
                        allAccountsCache.Add(updatedAccount);
                    }

                    // إرسال Trigger لـ HTMX لإشعار JS بأن الحساب تغير
                    Response.Headers.Add("HX-Trigger", "accountChanged");

                    alert = new AlertViewModel
                    {
                        Title = "نجاح العملية",
                        Message = $"تم تحديث الحساب: {updatedAccount.AccountName}",
                        Icon = "success",
                        ConfirmButtonText = "موافق",
                        Timer = 3000
                    };
                }
                else
                {
                    // Handle API errors and read the specific error message from the response.
                    alert = new AlertViewModel
                    {
                        Title = "فشل عملية التحديث",
                        Message = $"خطأ في تحديث الحساب: {response.ReasonPhrase}",
                        Icon = "error",
                        ConfirmButtonText = "موافق",
                        Timer = 3000
                    };
                }

                // Return a partial view with the message.
                return Partial("_SaveResultPartial", alert);
            }
            catch (Exception ex)
            {
                alert = new AlertViewModel
                {
                    Title = "فشل عملية التحديث",
                    Message = $"حدث خطأ أثناء تحديث الحساب: {ex.Message}",
                    Icon = "error",
                    ConfirmButtonText = "موافق",
                    Timer = 3000
                };

                return Partial("_SaveResultPartial", alert);
            }
        }

        public async Task<IActionResult> OnGetDeleteAccount(string accountNumber)
        {
            try
            {
                if (string.IsNullOrEmpty(accountNumber))
                    return new JsonResult(new { success = false, message = "رقم الحساب غير صالح." });

                var token = httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.DeleteAsync($"/api/Accounts/{accountNumber}");

                if (response.IsSuccessStatusCode)
                {
                    var deletedAccount = allAccountsCache.FirstOrDefault(a => a.AccountNumber == accountNumber);
                    if (deletedAccount != null)
                    {
                        allAccountsCache.Remove(deletedAccount);
                        OnGetTreeDataAsync(deletedAccount.FatherNumber);
                    }
                    return new JsonResult(new { success = true, message = "تم حذف الحساب بنجاح." });
                }
                else
                {
                    //$"تعذر حذف الحساب: {response.RequestMessage}",
                    return new JsonResult(new { success = false, message = $"تعذر حذف الحساب: {response.ReasonPhrase}" });
                }






              
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = $"خطأ: {ex.Message}" });
            }
        }


        #region Function
        public async Task<JsonResult> OnGetGenerateAccountNumber(string fatherNumber, string accountType)
        {
            try
            {
                if (string.IsNullOrEmpty(fatherNumber) || string.IsNullOrEmpty(accountType))
                {
                    return new JsonResult(new { success = false, message = "يرجى تحديد الحساب الأب ونوع الحساب." });
                }

                // منطق توليد رقم الحساب الجديد
                // مثال: إذا كان الأب = "100" ونوعه فرعي → نريد "10001", "10002", ...
                string newAccountNumber;

                // البحث عن آخر حساب فرعي تحت هذا الأب
                var lastChild = allAccountsCache.Where(a => a.FatherNumber == fatherNumber && a.AccountType == accountType).OrderByDescending(a => a.AccountNumber).FirstOrDefault();
                if (lastChild != null)
                {
                    newAccountNumber = (long.Parse(lastChild.AccountNumber) + 1).ToString();
                }
                else
                {

                    newAccountNumber = accountType != "رئيسي" ? $"{fatherNumber}001" : $"{fatherNumber}1";
                }

                return new JsonResult(new { success = true, accountNumber = newAccountNumber });
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = "حدث خطأ: " + ex.Message });
            }
        }

        /// <summary>
        /// API جلب بيانات الحسابات من
        /// </summary>
        /// <returns>قائمة باسماء الحسابات</returns>
        private async Task GetAccountListAsync()
        {
            try
            {
                var token = httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                allAccountsCache = await _httpClient.GetFromJsonAsync<List<Account>>("/api/Accounts/all");

                //return allAccountsCache ?? new List<Account>(); // إرجاع قائمة العملاء مباشرةً
            }
            catch (HttpRequestException ex)
            {
                // معالجة أخطاء HTTP (مثل مشاكل الاتصال أو رموز حالة خطأ)
                Console.WriteLine($"HTTP Request Error: {ex.Message}");
                // يمكنك هنا فحص ex.StatusCode للحصول على رمز حالة HTTP
                 allAccountsCache=new List<Account>(); // أو رمي استثناء إذا كنت تفضل ذلك
            }

            catch (Exception ex)
            {
                // معالجة أي أخطاء أخرى
                Console.WriteLine($"An error occurred: {ex.Message}");
                allAccountsCache= new List<Account>();
            }
            //// تحديد العقد الجذرية وتعيين خاصية HasChildren
            //accounts = allAccountsCache.Where(a => a.AccountType == "رئيسي").ToList();
            accounts = allAccountsCache.ToList();

        }

        public List<JsTreeNode> BuildJsTree(List<Account> accounts, List<Account> allAccounts)
        {
            var nodes = new List<JsTreeNode>();

            foreach (var acc in accounts)
            {
                bool hasChildren = allAccounts.Any(a => a.FatherNumber == acc.AccountNumber);

                nodes.Add(new JsTreeNode
                {
                    id = acc.AccountNumber ?? acc.ID.ToString(),
                    text = acc.AccountNumber!="0"? $"{acc.AccountNumber} - {acc.AccountName}": acc.AccountName ,
                    children = hasChildren,
                    type = GetTypeByAccount(acc) // 🔹 نحدد الأيقونة
                });
            }

            return nodes;
        }

        private string GetTypeByAccount(Account acc)
        {
            return acc.AccountType switch
            {
                "رئيسي" => "folder",   // حساب رئيسي
                "فرعي" => "file",     // حساب فرعي
                _ => "default"  // أيقونة افتراضية
            };
        }
        public async Task<PartialViewResult> OnGetEditAccount(string accountNumber)
        {
            // Find the account in the database using the provided account number.
            var accountToEdit = allAccountsCache.FirstOrDefault(a => a.AccountNumber == accountNumber);
            accounts = allAccountsCache;

            // Check if the account exists.
            if (accountToEdit == null)
            {
                // Handle the case where the account is not found.
                // You can return a message or a different partial view.
                var alert = new AlertViewModel
                {
                    Title = "فشل عملية الاضافة",
                    Message = $"خطأ Account not found. : {accountNumber}",
                    Icon = "erorr",
                    ConfirmButtonText = "موافق",
                    Timer = 3000
                };

                //var fatherAccountList = allAccountsCache.Where(a => a.AccountType == "رئيسي").ToList();

                //// 6. ارجع الجزء المحدث من الصفحة (النموذج الفارغ أو رسالة النجاح)
                //return Partial("_CreateAccountPartial", fatherAccountList);
            }

            // Pass both the account to edit and the list of father accounts to the partial view.
            return Partial("_EditAccountPartial", new Tuple<Account, List<Account>>(accountToEdit, accounts.ToList()));

        }
        public async Task<PartialViewResult> OnGetCreateAccountPartial()
        {
            // جلب قائمة الحسابات الأب لإرسالها إلى _CreateAccountPartial
            var fatherAccountList = allAccountsCache.Where(a => a.AccountType == "رئيسي").ToList();

            // تمرير القائمة مباشرة إلى Partial View
            return Partial("_CreateAccountPartial", fatherAccountList);
        }
        #endregion
    }
}
