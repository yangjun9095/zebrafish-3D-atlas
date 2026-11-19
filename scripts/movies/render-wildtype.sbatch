#!/bin/bash
# The wild-type movie: the fish growing from 0 to 48 hpf with no reporter, in two looks.
#
#   sbatch scripts/movies/render-wildtype.sbatch
#
# The viewer has no bright-field mode. The task opens the reporter preview with an empty rule list
# and the fish context at 100 (`--wildtype --context 100`), which draws every structure as
# translucent grey on the dark ground, keeps the frames, and encodes them twice:
#
#   wildtype_brightfield.mp4   the frames inverted (`--invert`): an off-white field and a
#                              sepia-grey embryo, the look of a transmitted-light image
#   wildtype_darkfield.mp4     the same frames as rendered: a grey embryo on black, to sit next
#                              to the reporter movies
#
# Measured on 2026-09-14: on the cpu nodes 8 to 34 s per frame (job 36208458 with 8 CPUs, job
# 36209136 with 32), because every structure is drawn; on the login node 1.2 to 3 s per frame and
# 18 minutes for the whole movie. Run it on the login node: `bash scripts/movies/render-wildtype.sbatch`.
#SBATCH --job-name=atlas-wildtype
#SBATCH --partition=cpu
#SBATCH --cpus-per-task=8
#SBATCH --mem=8G
#SBATCH --time=03:00:00
#SBATCH --output=%x-%j.out
#SBATCH --error=%x-%j.out

set -euo pipefail

REPO="${ATLAS_REPO:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas}"
OUT="${ATLAS_MOVIE_OUT:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas-movies}"
JOB="${SLURM_JOB_ID:-$$}"
DIST="$REPO/node_modules/.cache/atlas-movie-dist-wt-$JOB"
FRAMES="$OUT/.frames/wildtype-$JOB"
PORT="${ATLAS_MOVIE_PORT:-5199}"
FPS="${ATLAS_MOVIE_FPS:-30}"

cd "$REPO"
# The system ffmpeg 4.2 on most cpu nodes cannot load libvmaf.so.0; the site module ffmpeg/7.0
# is a static build with libx264 and works on every node. render-movie.ts reads $FFMPEG.
if [ -x /hpc/apps/ffmpeg/7.0/bin/ffmpeg ]; then export FFMPEG=/hpc/apps/ffmpeg/7.0/bin/ffmpeg; fi
echo "out $OUT, dist $DIST, frames $FRAMES, port $PORT, host $(hostname)"
echo "node $(node --version), chrome $(google-chrome --version 2>/dev/null || echo missing), ffmpeg $(${FFMPEG:-ffmpeg} -version | head -1)"

cleanup() { rm -rf "$FRAMES" "$DIST"; }
trap cleanup EXIT

node scripts/render-movie.ts --wildtype --invert --context 100 --fps "$FPS" \
  --keep-frames --frames "$FRAMES" --name wildtype_brightfield.mp4 \
  --out "$OUT" --dist "$DIST" --port "$PORT" "$@"

# The dark-field encode reuses the kept frames; the arguments match ffmpegArgs in render-movie.ts
# without the negate filter.
"${FFMPEG:-ffmpeg}" -hide_banner -loglevel error -nostdin -y -framerate "$FPS" \
  -i "$FRAMES/frame-%06d.png" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
  -movflags +faststart -an -r "$FPS" "$OUT/wildtype_darkfield.mp4"

ls -la "$OUT"/wildtype_*.mp4
