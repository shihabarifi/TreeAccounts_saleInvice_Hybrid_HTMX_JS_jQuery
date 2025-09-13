using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Net.Http.Headers;
using TreeAccounts_saleInvice.Models;

namespace TreeAccounts_saleInvice.Pages
{
    public class AccountsModel : PageModel
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AccountsModel(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            _httpContextAccessor = httpContextAccessor;
        }

        #region Properties

        /// <summary>
        /// قائمة الحسابات الحالية المعروضة في الصفحة
        /// </summary>
        public List<Account> Accounts { get; set; }

        /// <summary>
        /// Cache لجميع الحسابات لتحسين الأداء ومنع استدعاءات متكررة
        /// </summary>
        private static List<Account>? _allAccountsCache;

        /// <summary>
        /// حساب يتم تحريره حاليًا
        /// </summary>
        public Account AccountEditor { get; set; } = new Account();

        /// <summary>
        /// نموذج إضافة حساب جديد
        /// </summary>
        [BindProperty]
        public NewAccountModel NewAccount { get; set; }

        /// <summary>
        /// رسالة النتيجة بعد العملية
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// حالة نجاح العملية
        /// </summary>
        public bool IsSuccess { get; set; }

        #endregion

        #region Nested Models

        /// <summary>
        /// نموذج بيانات لإضافة حساب جديد
        /// </summary>
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

        /// <summary>
        /// نموذج لتمثيل بيانات شجرة الحسابات في JsTree
        /// </summary>
        public class JsTreeNode
        {
            public string id { get; set; } = "";
            public string text { get; set; } = "";
            public bool children { get; set; }
            public string type { get; set; } = "default"; // يحدد الأيقونة في JsTree
        }

        #endregion

        #region Page Lifecycle

        /// <summary>
        /// عند تحميل الصفحة يتم جلب قائمة الحسابات
        /// </summary>
        public async Task OnGetAsync()
        {
            await GetAccountListAsync();
        }

        #endregion

        #region CRUD Operations

        /// <summary>
        /// إضافة حساب جديد
        /// </summary>
        public async Task<PartialViewResult> OnPostSaveAccount()
        {
            AlertViewModel alert;

            // التحقق من صحة البيانات
            if (!ModelState.IsValid)
            {
                alert = CreateAlert("فشل عملية الاضافة", "الرجاء تعبئة الحقول المطلوبة.", "error");
                return Partial("_SaveResultPartial", alert);
            }

            try
            {
                // التحقق من عدم تكرار رقم الحساب
                if (_allAccountsCache.Any(a => a.AccountNumber == NewAccount.AccountNumber))
                {
                    alert = CreateAlert("فشل عملية الاضافة", "رقم الحساب موجود مسبقاً.", "error");
                    return Partial("_SaveResultPartial", alert);
                }

                // إنشاء كائن الحساب الجديد
                var newAccount = new Account
                {
                    AccountNumber = NewAccount.AccountNumber,
                    AccountName = NewAccount.AccountName,
                    FatherNumber = NewAccount.FatherNumber,
                    AccountType = NewAccount.AccountType,
                    AccountNameEng = NewAccount.AccountNameEng,
                    AccountReference = NewAccount.AccountReference,
                };

                // حفظ الحساب عبر API
                var token = _httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.PostAsJsonAsync("/api/Accounts", newAccount);

                if (response.IsSuccessStatusCode)
                {
                    var createdAccount = await response.Content.ReadFromJsonAsync<Account>();
                    newAccount.ID = createdAccount.ID;

                    // تحديث الكاش
                    _allAccountsCache.Add(newAccount);

                    // إعلام JS بتغيير الحساب
                    Response.Headers.Add("HX-Trigger", "accountChanged");

                    alert = CreateAlert("نجاح العملية", $"تمت إضافة الحساب: {NewAccount.AccountName}", "success");
                }
                else
                {
                    alert = CreateAlert("فشل عملية الاضافة", $"خطأ في إضافة الحساب: {response.ReasonPhrase}", "error");
                }

                return Partial("_SaveResultPartial", alert);
            }
            catch (Exception ex)
            {
                alert = CreateAlert("فشل عملية الاضافة", $"حدث خطأ أثناء إضافة الحساب: {ex.Message}", "error");
                return Partial("_SaveResultPartial", alert);
            }
        }

        /// <summary>
        /// تحديث حساب موجود
        /// </summary>
        public async Task<PartialViewResult> OnPostUpdateAccount()
        {
            AlertViewModel alert;

            if (!ModelState.IsValid)
            {
                alert = CreateAlert("فشل عملية التحديث", "الرجاء تعبئة الحقول المطلوبة.", "error");
                return Partial("_SaveResultPartial", alert);
            }

            try
            {
                var updatedAccount = new Account
                {
                    AccountNumber = NewAccount.AccountNumber,
                    AccountName = NewAccount.AccountName,
                    FatherNumber = NewAccount.FatherNumber,
                    AccountType = NewAccount.AccountType,
                    AccountNameEng = NewAccount.AccountNameEng,
                    AccountReference = NewAccount.AccountReference,
                };

                var accountToUpdate = _allAccountsCache.FirstOrDefault(a => a.AccountNumber == NewAccount.AccountNumber);
                if (accountToUpdate == null)
                {
                    alert = CreateAlert("فشل العملية", "الحساب غير موجود.", "error");
                    return Partial("_SaveResultPartial", alert);
                }

                var token = _httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.PutAsJsonAsync("/api/Accounts", updatedAccount);

                if (response.IsSuccessStatusCode)
                {
                    _allAccountsCache.Remove(accountToUpdate);
                    _allAccountsCache.Add(updatedAccount);

                    Response.Headers.Add("HX-Trigger", "accountChanged");

                    alert = CreateAlert("نجاح العملية", $"تم تحديث الحساب: {updatedAccount.AccountName}", "success");
                    NewAccount = new NewAccountModel(); // إعادة تهيئة النموذج
                }
                else
                {
                    alert = CreateAlert("فشل عملية التحديث", $"خطأ في تحديث الحساب: {response.ReasonPhrase}", "error");
                }

                return Partial("_SaveResultPartial", alert);
            }
            catch (Exception ex)
            {
                alert = CreateAlert("فشل عملية التحديث", $"حدث خطأ أثناء تحديث الحساب: {ex.Message}", "error");
                return Partial("_SaveResultPartial", alert);
            }
        }

        /// <summary>
        /// حذف حساب
        /// </summary>
        public async Task<IActionResult> OnGetDeleteAccount(string accountNumber)
        {
            if (string.IsNullOrEmpty(accountNumber))
                return new JsonResult(new { success = false, message = "رقم الحساب غير صالح." });

            try
            {
                var token = _httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.DeleteAsync($"/api/Accounts/{accountNumber}");

                if (response.IsSuccessStatusCode)
                {
                    var deletedAccount = _allAccountsCache.FirstOrDefault(a => a.AccountNumber == accountNumber);
                    if (deletedAccount != null)
                    {
                        _allAccountsCache.Remove(deletedAccount);
                        OnGetTreeDataAsync(deletedAccount.FatherNumber);
                    }
                    return new JsonResult(new { success = true, message = "تم حذف الحساب بنجاح." });
                }

                return new JsonResult(new { success = false, message = $"تعذر حذف الحساب: {response.ReasonPhrase}" });
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = $"خطأ: {ex.Message}" });
            }
        }

        #endregion

        #region Tree & Helper Functions

        /// <summary>
        /// جلب بيانات شجرة الحسابات (JsTree)
        /// </summary>
        public async Task<JsonResult> OnGetTreeDataAsync(string id)
        {
            try
            {
                var allAccounts = _allAccountsCache;
                List<Account> accounts;

                if (string.IsNullOrEmpty(id) || id == "#")
                    accounts = allAccounts.Where(a => string.IsNullOrEmpty(a.FatherNumber)).ToList();
                else
                    accounts = allAccounts.Where(a => a.FatherNumber == id && a.AccountNumber != "9").ToList();

                var treeData = BuildJsTree(accounts, allAccounts);
                return new JsonResult(treeData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching accounts: {ex.Message}");
                return new JsonResult(new List<JsTreeNode>());
            }
        }

        /// <summary>
        /// بناء بيانات JsTree من قائمة الحسابات
        /// </summary>
        private List<JsTreeNode> BuildJsTree(List<Account> accounts, List<Account> allAccounts)
        {
            return accounts.Select(acc => new JsTreeNode
            {
                id = acc.AccountNumber ?? acc.ID.ToString(),
                text = acc.AccountNumber != "0" ? $"{acc.AccountNumber} - {acc.AccountName}" : acc.AccountName,
                children = allAccounts.Any(a => a.FatherNumber == acc.AccountNumber),
                type = GetTypeByAccount(acc)
            }).ToList();
        }

        /// <summary>
        /// تحديد نوع الأيقونة لكل حساب
        /// </summary>
        private string GetTypeByAccount(Account acc)
        {
            return acc.AccountType switch
            {
                "رئيسي" => "folder",
                "فرعي" => "file",
                _ => "default"
            };
        }

        /// <summary>
        /// جلب قائمة الحسابات من API وحفظها في الكاش
        /// </summary>
        private async Task GetAccountListAsync()
        {
            try
            {
                var token = _httpContextAccessor.HttpContext?.Session.GetString("Token");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                _allAccountsCache = await _httpClient.GetFromJsonAsync<List<Account>>("/api/Accounts/all");
            }
            catch
            {
                _allAccountsCache = new List<Account>();
            }

            Accounts = _allAccountsCache.ToList();
        }

        /// <summary>
        /// توليد رقم حساب جديد بناءً على الأب ونوع الحساب
        /// </summary>
        public async Task<JsonResult> OnGetGenerateAccountNumber(string fatherNumber, string accountType)
        {
            if (string.IsNullOrEmpty(fatherNumber) || string.IsNullOrEmpty(accountType))
                return new JsonResult(new { success = false, message = "يرجى تحديد الحساب الأب ونوع الحساب." });

            string newAccountNumber;
            var lastChild = _allAccountsCache
                .Where(a => a.FatherNumber == fatherNumber && a.AccountType == accountType)
                .OrderByDescending(a => a.AccountNumber)
                .FirstOrDefault();

            newAccountNumber = lastChild != null
                ? (long.Parse(lastChild.AccountNumber) + 1).ToString()
                : (accountType != "رئيسي" ? $"{fatherNumber}001" : $"{fatherNumber}1");

            return new JsonResult(new { success = true, accountNumber = newAccountNumber });
        }

        /// <summary>
        /// إنشاء AlertViewModel جاهز
        /// </summary>
        private AlertViewModel CreateAlert(string title, string message, string icon)
        {
            return new AlertViewModel
            {
                Title = title,
                Message = message,
                Icon = icon,
                ConfirmButtonText = "موافق",
                Timer = 3000
            };
        }

        #endregion

        #region Partial Views (Create/Edit)

        /// <summary>
        /// جلب نموذج تعديل حساب
        /// </summary>
        public async Task<PartialViewResult> OnGetEditAccount(string accountNumber)
        {
            var accountToEdit = _allAccountsCache.FirstOrDefault(a => a.AccountNumber == accountNumber);
            Accounts = _allAccountsCache;

            return Partial("_EditAccountPartial", new Tuple<Account, List<Account>>(accountToEdit, Accounts.ToList()));
        }

        /// <summary>
        /// جلب نموذج إضافة حساب جديد
        /// </summary>
        public async Task<PartialViewResult> OnGetCreateAccountPartial()
        {
            var fatherAccountList = _allAccountsCache.Where(a => a.AccountType == "رئيسي").ToList();
            return Partial("_CreateAccountPartial", fatherAccountList);
        }

        #endregion
    }
}
