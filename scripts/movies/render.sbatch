#!/bin/bash
# Renders every movie of scripts/movies/tissues.json on one compute node.
#
#   sbatch scripts/movies/render.sbatch
#   sbatch scripts/movies/render.sbatch --only notochord,heart --force
#
# Every argument is passed on to scripts/movies/render-all.ts, so the defaults below can be
# overridden from the command line. The `cpu` partition has Chrome and ffmpeg (/usr/bin/ffmpeg,
# checked on cpu-b-5), so this needs no GPU: the viewer renders WebGL through SwiftShader.
#
# Measured on cpu-b-3 with 16 CPUs and --parallel 4: 6.4 seconds per frame, so one 600-frame
# movie takes about 65 minutes and the six-hour window holds about 20 movies. The 28 movies of a
# full 20-tissue list need two runs. Run this script again after a timeout: a movie whose file is
# already in the output directory is skipped, so the second run starts where the first stopped.
# Per-frame time follows the cores each Chrome gets, and throughput follows the CPU count, so
# --cpus-per-task 32 with --parallel 8 halves the wall time.
#
# Measured resource use of a --parallel 4 run on 16 CPUs (seff 36207214): CPU efficiency 91
# percent, memory 1.85 GB. The 32 GB below is the requested allocation and is 17 times what the
# run uses; 8 GB holds four Chrome copies with room to spare.
#SBATCH --job-name=atlas-movies
#SBATCH --partition=cpu
#SBATCH --cpus-per-task=16
#SBATCH --mem=32G
#SBATCH --time=06:00:00
#SBATCH --output=%x-%j.out
#SBATCH --error=%x-%j.out

set -euo pipefail

REPO="${ATLAS_REPO:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas}"
OUT="${ATLAS_MOVIE_OUT:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas-movies}"
# One build and one preview port per job, so two jobs on one node never collide.
JOB="${SLURM_JOB_ID:-0}"
DIST="${ATLAS_MOVIE_DIST:-$REPO/node_modules/.cache/atlas-movie-dist-$JOB}"
PORT="${ATLAS_MOVIE_PORT:-$((4952 + JOB % 900))}"

cd "$REPO"
# The system ffmpeg 4.2 on most cpu nodes cannot load libvmaf.so.0; the site module ffmpeg/7.0
# is a static build with libx264 and works on every node. render-movie.ts reads $FFMPEG.
if [ -x /hpc/apps/ffmpeg/7.0/bin/ffmpeg ]; then export FFMPEG=/hpc/apps/ffmpeg/7.0/bin/ffmpeg; fi
echo "node $(node --version), chrome $(google-chrome --version 2>/dev/null || echo missing), ffmpeg $(${FFMPEG:-ffmpeg} -version | head -1)"
echo "out $OUT, dist $DIST, port $PORT, host $(hostname)"

set +e
node scripts/movies/render-all.ts \
  --out "$OUT" \
  --dist "$DIST" \
  --port "$PORT" \
  --parallel 4 \
  "$@"
status=$?
set -e

rm -rf "$DIST"
echo "render-all exited with $status"
exit $status
