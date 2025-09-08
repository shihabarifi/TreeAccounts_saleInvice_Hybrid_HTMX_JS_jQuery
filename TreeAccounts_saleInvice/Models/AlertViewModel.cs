namespace TreeAccounts_saleInvice.Models
{
    public class AlertViewModel
    {
        public string Title { get; set; } = "تم الحفظ";
        public string Message { get; set; } = "تمت العملية بنجاح";
        public string Icon { get; set; } = "success"; // success | error | warning | info | question

        public string ConfirmButtonText { get; set; } = "حسناً";
        public int? Timer { get; set; } // ms

        public bool ShowCancelButton { get; set; } = false;
        public string CancelButtonText { get; set; } = "إلغاء";

        // الجديد ↓
        public bool IsToast { get; set; } = false;
        public string Position { get; set; } = "top-end"; // top-end | bottom-end | bottom-start ..
    }


}
