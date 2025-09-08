var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor(); // ·≈ «Õ… «·Ê’Ê· ··‹ Session
builder.Services.AddSession(); //  ›⁄Ì· «·‹ Session

// Add services to the container.
builder.Services.AddRazorPages();


builder.Services.AddHttpClient("UrlApi", client =>
{
    client.BaseAddress = new Uri("http://localhost:5229/"); // €Ì¯— «·—«»ÿ Õ”» «·‹ Minimal API ⁄‰œﬂ
});
// ≈⁄œ«œ HttpClient ·· ⁄«„· „⁄ API
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("http://localhost:5229/") });


var app = builder.Build();

// ≈÷«›… ≈⁄«œ… «· ÊÃÌÂ ··’›Õ… «·«› —«÷Ì…
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/")
    {
        context.Response.Redirect("/Login");
        return;
    }
    await next();
});

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}
app.UseStaticFiles();
app.UseSession(); //  ›⁄Ì· «·‹ Session
app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
