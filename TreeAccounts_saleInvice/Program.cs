var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor(); // ������ ������ ��� Session
builder.Services.AddSession(); // ����� ��� Session

// Add services to the container.
builder.Services.AddRazorPages();


builder.Services.AddHttpClient("UrlApi", client =>
{
    client.BaseAddress = new Uri("http://localhost:5229/"); // ���� ������ ��� ��� Minimal API ����
});
// ����� HttpClient ������� �� API
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("http://localhost:5229/") });


var app = builder.Build();

// ����� ����� ������� ������ ����������
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
app.UseSession(); // ����� ��� Session
app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
