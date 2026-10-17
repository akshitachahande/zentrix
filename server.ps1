# =============================================
# Zentrix Local Web Server (PowerShell)
# No Node.js or Python needed!
# =============================================

$port = 3000
$root = $PSScriptRoot  # Folder where this script lives

$url = "http://localhost:$port/"

# MIME types
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".webp" = "image/webp"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "    Zentrix Local Server is RUNNING!" -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Open your browser and go to:" -ForegroundColor White
Write-Host "  --> http://localhost:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Serving files from:" -ForegroundColor White
Write-Host "  $root" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

# Auto-open browser
Start-Process "http://localhost:$port"

try {
    while ($listener.IsListening) {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        # Build local file path
        $rawPath = $request.Url.LocalPath
        if ($rawPath -eq "/" -or $rawPath -eq "") { $rawPath = "/index.html" }

        $filePath = Join-Path $root ($rawPath.TrimStart("/").Replace("/", "\"))

        if (Test-Path $filePath -PathType Leaf) {
            $ext     = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime    = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes   = [System.IO.File]::ReadAllBytes($filePath)

            $response.ContentType   = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode    = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)

        } elseif (-not [System.IO.Path]::HasExtension($rawPath) -and (Test-Path (Join-Path $root "index.html"))) {
            $indexPath = Join-Path $root "index.html"
            $bytes = [System.IO.File]::ReadAllBytes($indexPath)
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "  [200 SPA Fallback] $rawPath -> index.html" -ForegroundColor Cyan
        } else {
            $body  = [System.Text.Encoding]::UTF8.GetBytes("<h2>404 - Not Found</h2><p>$rawPath</p>")
            $response.ContentType   = "text/html"
            $response.StatusCode    = 404
            $response.ContentLength64 = $body.Length
            $response.OutputStream.Write($body, 0, $body.Length)

            Write-Host "  [404] $rawPath" -ForegroundColor Red
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "  Server stopped." -ForegroundColor DarkGray
}
