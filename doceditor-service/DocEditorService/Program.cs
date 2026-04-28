using Syncfusion.Licensing;

var builder = WebApplication.CreateBuilder(args);

// Register Syncfusion license
SyncfusionLicenseProvider.RegisterLicense("NxYtGyMROh0gHDMgDk1jX09FaFtGVmZWfFtpR2NbeU53flVDal5WVAciSV9jS3hTckdrWXhccnRUQmdUU091XA==");

builder.Services.AddControllers().AddNewtonsoftJson();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
});

var app = builder.Build();

app.UseCors();
app.MapControllers();

app.Run("http://0.0.0.0:8090");
