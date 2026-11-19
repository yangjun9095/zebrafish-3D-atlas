#!/bin/bash
# One SLURM array task per tissue of scripts/movies/tissues.json. Each task renders that
# tissue's EGFP movie and, for the eight ranked tissues, its colour-series movie, two at a time.
#
#   sbatch scripts/movies/render-array.sbatch            # array 0-19 set below
#   sbatch --array=3,7 scripts/movies/render-array.sbatch # two tissues only
#   ATLAS_MOVIE_PORT_BASE=5300 sbatch --array=1,4 scripts/movies/render-array.sbatch
#                                                         # next to a running array: other ports
#
# Measured (see render.sbatch): about 1.6 core-hours of SwiftShader time per 600-frame movie.
# With 8 CPUs and --parallel 2 a task finishes its one or two movies in roughly an hour, and the
# whole list finishes in about the same wall time when the queue runs every task at once.
# A movie whose file already exists in the output directory is skipped, so a resubmission
# after a timeout starts where the first run stopped.
#SBATCH --job-name=atlas-movie
#SBATCH --partition=cpu
#SBATCH --array=0-19
#SBATCH --cpus-per-task=8
#SBATCH --mem=8G
#SBATCH --time=04:00:00
#SBATCH --output=%x-%A_%a.out
#SBATCH --error=%x-%A_%a.out

set -euo pipefail

REPO="${ATLAS_REPO:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas}"
OUT="${ATLAS_MOVIE_OUT:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas-movies}"
TASK="${SLURM_ARRAY_TASK_ID:-0}"
JOB="${SLURM_JOB_ID:-0}"
DIST="$REPO/node_modules/.cache/atlas-movie-dist-$JOB"
PORT=$(( ${ATLAS_MOVIE_PORT_BASE:-5100} + TASK ))

cd "$REPO"
# The system ffmpeg 4.2 on most cpu nodes cannot load libvmaf.so.0; the site module ffmpeg/7.0
# is a static build with libx264 and works on every node. render-movie.ts reads $FFMPEG.
if [ -x /hpc/apps/ffmpeg/7.0/bin/ffmpeg ]; then export FFMPEG=/hpc/apps/ffmpeg/7.0/bin/ffmpeg; fi
SLUG=$(node -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const rows=Array.isArray(t)?t:t.tissues;const i=Number(process.argv[2]);if(!rows[i]){console.error("no tissue at index "+i);process.exit(2)}console.log(rows[i].slug)' scripts/movies/tissues.json "$TASK")
echo "task $TASK slug $SLUG host $(hostname) port $PORT dist $DIST"
echo "node $(node --version), chrome $(google-chrome --version 2>/dev/null || echo missing), ffmpeg $(${FFMPEG:-ffmpeg} -version | head -1)"

set +e
node scripts/movies/render-all.ts --out "$OUT" --dist "$DIST" --port "$PORT" --parallel 2 --only "$SLUG" "$@"
status=$?
set -e
rm -rf "$DIST"
echo "render-all exited with $status"
exit $status
