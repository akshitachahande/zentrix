# =============================================
# start-server.ps1  -  Zentrix Website
# Runs a simple HTTP server on localhost:3000
# =============================================
$port = 3000
$root = $PSScriptRoot

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  [OK]  Server running at  http://localhost:$port" -ForegroundColor Green
Write-Host "  [DIR] Serving files from: $root" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

# Open browser automatically
Start-Process "http://localhost:$port"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".map"  = "application/json"
}

try {
    while ($listener.IsListening) {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $filePath = Join-Path $root $urlPath.TrimStart("/").Replace("/", "\")

        if (Test-Path $filePath -PathType Leaf) {
            $ext   = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime  = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)

            $response.ContentType     = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode      = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)

            Write-Host "  200  $urlPath" -ForegroundColor DarkGray
        } else {
            $indexPath = Join-Path $root "index.html"
            if (Test-Path $indexPath) {
                $bytes = [System.IO.File]::ReadAllBytes($indexPath)
                $response.ContentType     = "text/html; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.StatusCode      = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
            Write-Host "  404  $urlPath" -ForegroundColor Red
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Host ""
    Write-Host "  Server stopped." -ForegroundColor Yellow
}
