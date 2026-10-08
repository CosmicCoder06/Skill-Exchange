# -------------------------------------------------
# record_skill_exchange_demo.ps1
# -------------------------------------------------
# Location: d:\College\sumInt\Skill-Exchange\record_skill_exchange_demo.ps1
# -------------------------------------------------

# ==== CONFIGURATION ====
$projectRoot   = "D:\College\sumInt\Skill-Exchange"
$videoFileName = "skill-exchange-demo.mp4"
$durationSec   = 90               # 1 minute 30 seconds
$ffmpegPath    = "ffmpeg"         # assumes ffmpeg is on PATH
$targetUrl     = "https://skill-exchange-one-eta.vercel.app"

# -------------------------------------------------
# Helper: Launch the web app in the default browser
# -------------------------------------------------
Start-Process $targetUrl

# Small pause to give the browser time to start (adjust if needed)
Start-Sleep -Seconds 5

# -------------------------------------------------
# Build the FFmpeg command
# -------------------------------------------------
# Capture the entire desktop (gdigrab). If you want a specific window,
# replace `-i desktop` with something like:
#   -i title="Google Chrome"   # captures the Chrome window titled "Skill‑Exchange"
#   -i title="Mozilla Firefox" # etc.
#
# The `-t` flag limits recording to $durationSec seconds.
# Adjust `-r` (framerate) or `-vf` (video filter) as desired.

$ffmpegArgs = @(
    "-f", "gdigrab",               # input: desktop capture
    "-framerate", "30",            # 30 fps (smooth enough for UI demos)
    "-i", "desktop",               # capture whole screen
    "-t", $durationSec,            # stop after 90 seconds
    "-c:v", "libx264",             # encoder
    "-preset", "veryfast",         # quick encoding
    "-crf", "23",                  # quality (lower = higher quality)
    "-pix_fmt", "yuv420p",         # compatibility
    "-y",                         # overwrite output if it exists
    (Join-Path $projectRoot $videoFileName)
)

# -------------------------------------------------
# Execute FFmpeg
# -------------------------------------------------
Write-Host "Recording $durationSec seconds to $(Join-Path $projectRoot $videoFileName)..."
& $ffmpegPath $ffmpegArgs

# -------------------------------------------------
# Completion notice
# -------------------------------------------------
Write-Host "✅ Recording complete! Video saved at:"
Write-Host (Join-Path $projectRoot $videoFileName)
