# Load environment variables from .env.production
if (Test-Path .env.production) {
    Get-Content .env.production | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Output "Set $name"
        }
    }
}

# Run the build
npm run build
