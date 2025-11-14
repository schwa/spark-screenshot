#!/usr/bin/env node

import { Command } from 'commander';
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('spark-screenshot')
  .description('CLI tool for taking screenshots of 3D Gaussian Splatting renders using sparkjs')
  .version('1.0.0')
  .requiredOption('-s, --splat <path>', 'Path to splat file')
  .option('-w, --width <number>', 'Width of the screenshot', '1200')
  .option('-h, --height <number>', 'Height of the screenshot', '800')
  .option('-p, --camera-position <x,y,z>', 'Camera position', '0,0,5')
  .option('-l, --camera-look-at <x,y,z>', 'Camera look-at target', '0,0,0')
  .option('-f, --fov <number>', 'Vertical field of view in degrees', '75')
  .option('--near <number>', 'Camera near clipping plane', '0.1')
  .option('--far <number>', 'Camera far clipping plane', '1000')
  .option('--no-sh', 'Disable spherical harmonics')
  .option('--color-space <type>', 'Output color space: srgb or linear', 'srgb')
  .option('-b, --background-color <r,g,b>', 'Background color as RGB values (0-255)', '0,0,0')
  .option('-o, --output <path>', 'Output file path', 'screenshot.png')
  .option('--port <number>', 'Port for local server', '8765')
  .parse(process.argv);

const options = program.opts();

// Validate splat file exists
const splatPath = resolve(options.splat);
if (!existsSync(splatPath)) {
  console.error(`Error: Splat file not found: ${splatPath}`);
  process.exit(1);
}

// Parse numeric options
const width = parseInt(options.width);
const height = parseInt(options.height);
const port = parseInt(options.port);

if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
  console.error('Error: Width and height must be positive numbers');
  process.exit(1);
}

// Validate color space
const validColorSpaces = ['srgb', 'linear'];
if (!validColorSpaces.includes(options.colorSpace.toLowerCase())) {
  console.error(`Error: Color space must be one of: ${validColorSpaces.join(', ')}`);
  process.exit(1);
}


// Create a simple HTTP server to serve files
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === '/') {
    // Serve the render.html file
    const html = readFileSync(resolve(__dirname, 'render.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (url.pathname === '/splat') {
    // Serve the splat file
    try {
      const splatData = readFileSync(splatPath);
      const ext = basename(splatPath).split('.').pop().toLowerCase();

      // Set appropriate content type based on extension
      const contentTypes = {
        'ply': 'application/octet-stream',
        'splat': 'application/octet-stream',
        'spz': 'application/octet-stream',
        'ksplat': 'application/octet-stream',
        'sogs': 'application/octet-stream'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(splatData);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error loading splat file: ${error.message}`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, async () => {
  try {
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // Set up console message logging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.error('Browser error:', msg.text());
      }
    });

    // Build URL with parameters
    const renderUrl = `http://localhost:${port}/?splat=${encodeURIComponent('http://localhost:' + port + '/splat')}&width=${width}&height=${height}&cameraPosition=${encodeURIComponent(options.cameraPosition)}&lookAt=${encodeURIComponent(options.cameraLookAt)}&fov=${options.fov}&near=${options.near}&far=${options.far}&noSh=${!options.sh}&colorSpace=${options.colorSpace.toLowerCase()}&backgroundColor=${encodeURIComponent(options.backgroundColor)}`;
    await page.goto(renderUrl, { waitUntil: 'networkidle0' });

    // Wait for render to complete
    await page.waitForFunction(
      () => window.renderComplete === true,
      { timeout: 30000 }
    );

    // Check for errors
    const renderError = await page.evaluate(() => window.renderError);
    if (renderError) {
      throw new Error(`Render error: ${renderError}`);
    }

    // Take screenshot
    await page.screenshot({
      path: options.output,
      type: 'png'
    });

    await browser.close();
    server.close();

    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    server.close();
    process.exit(1);
  }
});
