namespace TreeAccounts_saleInvice.Models
{
    public class Account
    {
        public long ID { get; set; }
        public string? FatherNumber { get; set; }
        public string? AccountName { get; set; }
        public string? AccountNameEng { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountType { get; set; }
        public string? AccountReference { get; set; }
        public long? GroupID { get; set; }
        public short? System { get; set; }
        public long? FatherID { get; set; }
    }
}
