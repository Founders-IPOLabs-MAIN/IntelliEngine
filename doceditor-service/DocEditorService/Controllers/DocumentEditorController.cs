using Microsoft.AspNetCore.Mvc;
using Syncfusion.EJ2.DocumentEditor;
using Newtonsoft.Json;

namespace DocEditorService.Controllers;

[ApiController]
[Route("api/documenteditor")]
public class DocumentEditorController : ControllerBase
{
    [HttpPost("Import")]
    public IActionResult Import(IFormCollection data)
    {
        if (data.Files.Count == 0)
            return BadRequest("No file uploaded");

        try
        {
            using var stream = new MemoryStream();
            var file = data.Files[0];

            if (file.Length > 10 * 1024 * 1024)
                return BadRequest("File size exceeds 10MB limit");

            file.CopyTo(stream);
            stream.Position = 0;

            var document = WordDocument.Load(stream, GetFormatType(file.FileName));
            string sfdt = JsonConvert.SerializeObject(document);
            document.Dispose();

            return Content(sfdt, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Import failed: {ex.Message}");
        }
    }

    [HttpPost("RestrictEditing")]
    public IActionResult RestrictEditing([FromBody] object data)
    {
        return Ok(new { isAuthenticated = true });
    }

    [HttpPost("SpellCheck")]
    public IActionResult SpellCheck([FromBody] object data)
    {
        return Ok(new { HasSuggestions = false, Suggestions = Array.Empty<string>() });
    }

    [HttpPost("SystemClipboard")]
    public IActionResult SystemClipboard([FromBody] object data)
    {
        return Ok();
    }

    private static FormatType GetFormatType(string fileName)
    {
        var ext = Path.GetExtension(fileName)?.ToLower();
        return ext switch
        {
            ".docx" => FormatType.Docx,
            ".doc" => FormatType.Doc,
            ".rtf" => FormatType.Rtf,
            ".txt" => FormatType.Txt,
            _ => FormatType.Docx
        };
    }
}
