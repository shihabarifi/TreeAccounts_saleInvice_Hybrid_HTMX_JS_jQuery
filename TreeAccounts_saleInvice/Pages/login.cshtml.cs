using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Net.Http.Headers;
using System.Net.Http;
using TreeAccounts_saleInvice.Models;

namespace TreeAccounts_saleInvice.Pages
{
    public class loginModel : PageModel
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor httpContextAccessor;
        private const string BaseUrl = "/api/user";
        private string _token;
        public loginModel(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            this.httpContextAccessor = httpContextAccessor;

        }
        #region Proprieties

        [BindProperty]
        public string Username { get; set; }

        [BindProperty]
        public string Password { get; set; }

        public string ErrorMessage { get; set; }
        #endregion

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
                return Page();

            var result = await AuthenticateUserAsync(Username, Password);

            if (result != null && result.IsAuthenticated)
            {
                //  Œ“Ì‰ «· Êﬂ‰ ›Ì Session
                httpContextAccessor.HttpContext.Session.SetString("Token", result.Token);

                // ≈⁄«œ…  ÊÃÌÂ ≈·Ï «·’›Õ… «·—∆Ì”Ì… »⁄œ «·‰Ã«Õ
                return Redirect("/Index");
            }

            ErrorMessage = result.Message;
            return Page();
        }


        public async Task<AuthModel> AuthenticateUserAsync(string username, string password)
        {
            var request = new UserLoginRequest
            {
                username = username,
                password = password
            };

            var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/login", request);

            if (response.IsSuccessStatusCode)
            {
                var authResult = await response.Content.ReadFromJsonAsync<AuthModel>();
                if (authResult != null && authResult.IsAuthenticated)
                {
                    _token = authResult.Token;
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
                }
                // var X = await _httpClient.GetFromJsonAsync<string>("http://localhost:5236/api/Auth/refreshToken");
                // var X = await _httpClient.GetFromJsonAsync<string>($"{BaseUrl}/protected");
                // var X = GetCustomersDataAsync();
                return authResult;
            }

            return new AuthModel { Message = "Login failed.", IsAuthenticated = false };
        }
    }
}
