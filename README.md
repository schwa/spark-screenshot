# spark-screenshot

CLI tool for taking screenshots of 3D Gaussian Splatting renders using [sparkjs](https://sparkjs.dev/).

## Installation

### Local Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd spark-screenshot
npm install
```

Run the tool:

```bash
node index.js --splat <path-to-splat-file> [options]
```

### Global Installation

Install globally to use the `spark-screenshot` command from anywhere:

```bash
npm install -g .
```

Or from npm (if published):

```bash
npm install -g spark-screenshot
```

Then use:

```bash
spark-screenshot --splat <path-to-splat-file> [options]
```

## Usage

```bash
spark-screenshot --splat <path-to-splat-file> [options]
```

### Options

- `-s, --splat <path>` - Path to splat file (required)
- `-w, --width <number>` - Width of the screenshot (default: 1280)
- `-h, --height <number>` - Height of the screenshot (default: 800)
- `-p, --camera-position <x,y,z>` - Camera position (default: 0,0,5)
- `-l, --camera-look-at <x,y,z>` - Camera look-at target (default: 0,0,0)
- `-f, --fov <number>` - Vertical field of view in degrees (default: 75)
- `--near <number>` - Camera near clipping plane (default: 0.1)
- `--far <number>` - Camera far clipping plane (default: 1000)
- `--no-sh` - Disable spherical harmonics
- `-o, --output <path>` - Output file path (default: screenshot.png)
- `--port <number>` - Port for local server (default: 8765)

### Examples

Basic usage:
```bash
spark-screenshot --splat ./my-splat.ply
```

Custom dimensions and camera:
```bash
spark-screenshot --splat ./my-splat.ply --width 1920 --height 1080 --camera-position 0,2,-5 --camera-look-at 0,0,0
```

Custom field of view:
```bash
spark-screenshot --splat ./my-splat.ply --fov 45 --output wide-angle.png
```

Disable spherical harmonics for simpler rendering:
```bash
spark-screenshot --splat ./my-splat.ply --no-sh --output no-sh.png
```

Custom clipping planes:
```bash
spark-screenshot --splat ./my-splat.ply --near 0.5 --far 500
```

Full example with all options:
```bash
spark-screenshot --splat ./butterfly.spz --width 1920 --height 1080 --camera-position 0,0,-5 --camera-look-at 0,0,0 --fov 60 --near 0.1 --far 1000 --output ./renders/butterfly.png
```

## Supported Formats

The tool supports all formats supported by sparkjs:
- `.ply` - PLY files
- `.splat` - Splat files
- `.spz` - SPZ files
- `.ksplat` - KSplat files
- `.sogs` - SOGS files

## How it Works

1. Starts a local HTTP server to serve the splat file and renderer
2. Launches a headless browser using Puppeteer
3. Loads the splat file using sparkjs/THREE.js
4. Renders the scene with specified camera settings
5. Captures a screenshot
6. Saves to the specified output path

## Requirements

- Node.js (v18 or higher recommended)
- npm

## License

MIT
